import { randomUUID, createDecipheriv, timingSafeEqual } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
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
          barcodeLast4: string;
          barcodeVault: VaultEnvelope;
          supplierLabel: string;
        }
      | undefined;
    if (!voucher) {
      return json(409, { message: 'No voucher inventory available for denomination.' });
    }

    const now = new Date().toISOString();
    const allocationId = `va_${randomUUID()}`;

    await dynamo.send(
      new UpdateCommand({
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
      })
    );

    await dynamo.send(
      new PutCommand({
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
      })
    );

    await dynamo.send(
      new PutCommand({
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
      })
    );

    const voucherCode = await decryptString(voucher.barcodeVault);

    return json(200, {
      voucherAllocationId: allocationId,
      status: 'allocated',
      denomination: body.denomination,
      voucherId: voucher.voucherId,
      supplier: voucher.supplierLabel,
      barcodeLast4: voucher.barcodeLast4,
      voucherCode,
      deliveryStatus: 'pending',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
