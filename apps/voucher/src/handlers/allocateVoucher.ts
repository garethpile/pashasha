import { createDecipheriv, timingSafeEqual } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { json, requireEnv, VaultEnvelope } from '../lib/shared';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});
let cachedCoreApiKey: string | undefined;
let cachedVault: { masterKeyB64: string } | undefined;

const assertCoreApiKey = async (provided?: string) => {
  if (!provided) throw new Error('Missing core API key.');
  if (!cachedCoreApiKey) {
    const response = await secrets.send(
      new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_CORE_API_KEY_SECRET_ARN') })
    );
    const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
    if (!parsed.apiKey) throw new Error('Voucher core API key secret missing apiKey.');
    cachedCoreApiKey = parsed.apiKey;
  }
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(cachedCoreApiKey);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid core API key.');
  }
};

const getVault = async () => {
  if (cachedVault) return cachedVault;
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_VAULT_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { masterKeyB64?: string };
  if (!parsed.masterKeyB64) throw new Error('Voucher vault secret missing masterKeyB64.');
  cachedVault = { masterKeyB64: parsed.masterKeyB64 };
  return cachedVault;
};

const decryptString = async (envelope: VaultEnvelope) => {
  const vault = await getVault();
  const key = Buffer.from(vault.masterKeyB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

const getExistingAllocation = async (transactionId: string) => {
  const existing = await dynamo.send(
    new QueryCommand({
      TableName: requireEnv('VOUCHER_ALLOCATIONS_TABLE_NAME'),
      IndexName: 'byTransaction',
      KeyConditionExpression: 'transactionId = :transactionId',
      ExpressionAttributeValues: {
        ':transactionId': transactionId,
      },
      Limit: 1,
    })
  );

  return existing.Items?.[0] as
    | {
        allocationId: string;
        transactionId: string;
        civilServantId: string;
        voucherId: string;
        denomination: number;
        status: string;
        deliveryStatus?: string;
      }
    | undefined;
};

const buildAllocationResponse = async (allocation: {
  allocationId: string;
  voucherId: string;
  denomination: number;
  status: string;
  deliveryStatus?: string;
}) => {
  const inventory = await dynamo.send(
    new GetCommand({
      TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
      Key: { voucherId: allocation.voucherId },
    })
  );

  const voucher = inventory.Item as
    | {
        barcodeLast4: string;
        barcodeVault: VaultEnvelope;
        supplierLabel: string;
      }
    | undefined;

  if (!voucher?.barcodeVault) {
    throw new Error('Allocated voucher inventory record not found.');
  }

  let voucherCode: string | null = null;
  let voucherCodeStatus: 'available' | 'unavailable' = 'available';
  try {
    voucherCode = await decryptString(voucher.barcodeVault);
  } catch {
    voucherCodeStatus = 'unavailable';
  }

  return {
    voucherAllocationId: allocation.allocationId,
    status: allocation.status,
    denomination: allocation.denomination,
    voucherId: allocation.voucherId,
    supplier: voucher.supplierLabel,
    barcodeLast4: voucher.barcodeLast4,
    voucherCode,
    voucherCodeStatus,
    deliveryStatus: allocation.deliveryStatus ?? 'pending',
  };
};

const quarantineUndecryptableVoucher = async (voucher: {
  voucherId: string;
  supplierKey?: string;
  barcodeVault?: VaultEnvelope;
  denominationStatusKey?: string;
}) => {
  if (!voucher.barcodeVault) return false;
  try {
    await decryptString(voucher.barcodeVault);
    return true;
  } catch {
    const now = new Date().toISOString();
    const amountMinor = Number(String(voucher.denominationStatusKey ?? '0').split('#')[0] || '0');
    await dynamo.send(
      new UpdateCommand({
        TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
        Key: { voucherId: voucher.voucherId },
        ConditionExpression: '#status = :available',
        UpdateExpression:
          'SET #status = :error, updatedAt = :updatedAt, supplierStatusKey = :supplierStatusKey, denominationStatusKey = :denominationStatusKey, allocationError = :allocationError',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':available': 'available',
          ':error': 'error',
          ':updatedAt': now,
          ':supplierStatusKey': `${voucher.supplierKey ?? 'shoprite-checkers'}#error`,
          ':denominationStatusKey': `${amountMinor}#error`,
          ':allocationError': 'voucher-code-unavailable',
        },
      })
    );
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: requireEnv('VOUCHER_AUDIT_TABLE_NAME'),
              Item: {
                voucherId: voucher.voucherId,
                createdAt: now,
                eventType: 'voucher.quarantined',
                actorType: 'system',
                metadata: {
                  reason: 'decrypt-failed',
                },
              },
            },
          },
        ],
      })
    );
    return false;
  }
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertCoreApiKey(event.headers['x-core-api-key'] ?? event.headers['X-Core-Api-Key']);
    const body = event.body
      ? (JSON.parse(event.body) as {
          transactionId?: string;
          civilServantId?: string;
          denomination?: number;
        })
      : {};
    if (!body.transactionId || !body.civilServantId || typeof body.denomination !== 'number') {
      return json(400, { message: 'transactionId, civilServantId and denomination are required.' });
    }

    const existingAllocation = await getExistingAllocation(body.transactionId);
    if (existingAllocation) {
      return json(200, await buildAllocationResponse(existingAllocation));
    }

    const now = new Date().toISOString();
    const allocationId = `va_${body.transactionId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const inventory = await dynamo.send(
        new QueryCommand({
          TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
          IndexName: 'byDenominationStatus',
          KeyConditionExpression: 'denominationStatusKey = :key',
          ExpressionAttributeValues: {
            ':key': `${body.denomination * 100}#available`,
          },
          Limit: 1,
        })
      );

      const voucher = inventory.Items?.[0] as
        | {
            voucherId: string;
            supplierLabel: string;
            supplierKey?: string;
            barcodeVault?: VaultEnvelope;
            denominationStatusKey?: string;
          }
        | undefined;

      if (!voucher) {
        break;
      }

      const voucherUsable = await quarantineUndecryptableVoucher(voucher);
      if (!voucherUsable) {
        continue;
      }

      try {
        await dynamo.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Update: {
                  TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
                  Key: { voucherId: voucher.voucherId },
                  ConditionExpression: '#status = :available',
                  UpdateExpression:
                    'SET #status = :allocated, updatedAt = :updatedAt, supplierStatusKey = :supplierStatusKey, denominationStatusKey = :denominationStatusKey, allocatedTransactionId = :transactionId, allocatedCivilServantId = :civilServantId',
                  ExpressionAttributeNames: { '#status': 'status' },
                  ExpressionAttributeValues: {
                    ':available': 'available',
                    ':allocated': 'allocated',
                    ':updatedAt': now,
                    ':supplierStatusKey': `shoprite-checkers#allocated`,
                    ':denominationStatusKey': `${body.denomination * 100}#allocated`,
                    ':transactionId': body.transactionId,
                    ':civilServantId': body.civilServantId,
                  },
                },
              },
              {
                Put: {
                  TableName: requireEnv('VOUCHER_ALLOCATIONS_TABLE_NAME'),
                  Item: {
                    allocationId,
                    transactionId: body.transactionId,
                    civilServantId: body.civilServantId,
                    voucherId: voucher.voucherId,
                    denomination: body.denomination,
                    status: 'allocated',
                    deliveryStatus: 'pending',
                    createdAt: now,
                    updatedAt: now,
                  },
                  ConditionExpression: 'attribute_not_exists(allocationId)',
                },
              },
              {
                Put: {
                  TableName: requireEnv('VOUCHER_AUDIT_TABLE_NAME'),
                  Item: {
                    voucherId: voucher.voucherId,
                    createdAt: now,
                    eventType: 'voucher.allocated',
                    actorType: 'system',
                    metadata: {
                      allocationId,
                      transactionId: body.transactionId,
                      civilServantId: body.civilServantId,
                    },
                  },
                },
              },
            ],
          })
        );

        const createdAllocation = await getExistingAllocation(body.transactionId);
        if (!createdAllocation) {
          throw new Error('Allocation record missing after successful voucher allocation.');
        }
        return json(200, await buildAllocationResponse(createdAllocation));
      } catch (error) {
        const existing = await getExistingAllocation(body.transactionId);
        if (existing) {
          return json(200, await buildAllocationResponse(existing));
        }

        if (
          error instanceof Error &&
          !/ConditionalCheckFailed|TransactionCanceled/i.test(error.name) &&
          !/ConditionalCheckFailed|TransactionCanceled/i.test(error.message)
        ) {
          throw error;
        }
      }
    }

    return json(409, { message: 'No voucher inventory available for denomination.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
