import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import {
  encryptString,
  fingerprint,
  parseShopriteCheckersSms,
  redactBarcode,
  requireEnv,
} from './shared';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});

let cachedVaultSecret: { masterKeyB64: string; keyVersion: string } | undefined;

export class DuplicateVoucherError extends Error {
  constructor() {
    super('Voucher already loaded.');
  }
}

const getVaultSecret = async () => {
  if (cachedVaultSecret) return cachedVaultSecret;

  const secretId = requireEnv('VOUCHER_VAULT_SECRET_ARN');
  const response = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) {
    throw new Error('Voucher vault secret is empty.');
  }

  const parsed = JSON.parse(response.SecretString) as {
    masterKeyB64?: string;
    keyVersion?: string;
  };

  if (!parsed.masterKeyB64) {
    throw new Error('Voucher vault secret missing masterKeyB64.');
  }

  cachedVaultSecret = {
    masterKeyB64: parsed.masterKeyB64,
    keyVersion: parsed.keyVersion ?? 'v1',
  };
  return cachedVaultSecret;
};

export interface IngestVoucherParams {
  smsText: string;
  source: 'telegram-admin-bot' | 'web-admin-console';
  actorId: string;
  actorType: 'administrator' | 'system';
  ingestedByUserId?: string;
  ingestedByActorId?: string;
}

export interface IngestVoucherResult {
  voucherId: string;
  supplier: string;
  amount: number;
  amountMinor: number;
  currency: 'ZAR';
  barcodeMasked: string;
  status: 'available';
  ingestedAt: string;
}

export const ingestShopriteCheckersVoucher = async (
  params: IngestVoucherParams
): Promise<IngestVoucherResult> => {
  const parsed = parseShopriteCheckersSms(params.smsText);
  const barcodeHash = fingerprint(parsed.barcode);
  const existing = await dynamo.send(
    new ScanCommand({
      TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
      FilterExpression: 'barcodeHash = :barcodeHash',
      ExpressionAttributeValues: {
        ':barcodeHash': barcodeHash,
      },
      ProjectionExpression: 'voucherId',
      Limit: 1,
    })
  );
  if ((existing.Items ?? []).length > 0) {
    throw new DuplicateVoucherError();
  }

  const now = new Date().toISOString();
  const voucherId = randomUUID();
  const vault = await getVaultSecret();
  const barcodeLast4 = parsed.barcode.slice(-4);

  const record = {
    voucherId,
    supplierKey: 'shoprite-checkers',
    supplierLabel: 'Shoprite Checkers',
    amountMinor: parsed.amountMinor,
    currency: 'ZAR',
    status: 'available',
    barcodeLast4,
    barcodeHash,
    rawSmsHash: fingerprint(params.smsText),
    barcodeVault: encryptString(parsed.barcode, vault.masterKeyB64, vault.keyVersion),
    rawSmsVault: encryptString(params.smsText, vault.masterKeyB64, vault.keyVersion),
    source: params.source,
    createdAt: now,
    updatedAt: now,
    ingestedByUserId: params.ingestedByUserId ?? params.actorId,
    ingestedByActorId: params.ingestedByActorId ?? params.actorId,
    supplierStatusKey: 'shoprite-checkers#available',
    denominationStatusKey: `${parsed.amountMinor}#available`,
  };

  await dynamo
    .send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: requireEnv('VOUCHER_BARCODE_REGISTRY_TABLE_NAME'),
              Item: {
                barcodeHash,
                voucherId,
                createdAt: now,
                barcodeLast4,
                amountMinor: parsed.amountMinor,
                supplierKey: 'shoprite-checkers',
              },
              ConditionExpression: 'attribute_not_exists(barcodeHash)',
            },
          },
          {
            Put: {
              TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
              Item: record,
              ConditionExpression: 'attribute_not_exists(voucherId)',
            },
          },
          {
            Put: {
              TableName: requireEnv('VOUCHER_AUDIT_TABLE_NAME'),
              Item: {
                voucherId,
                createdAt: now,
                eventType: 'admin.voucher.ingested',
                actorId: params.actorId,
                actorType: params.actorType,
                metadata: {
                  supplierKey: 'shoprite-checkers',
                  amountMinor: parsed.amountMinor,
                  currency: 'ZAR',
                  barcodeLast4,
                  source: params.source,
                },
              },
            },
          },
        ],
      })
    )
    .catch((error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TransactionCanceledException'
      ) {
        throw new DuplicateVoucherError();
      }
      throw error;
    });

  return {
    voucherId,
    supplier: 'Shoprite Checkers',
    amount: parsed.amountMinor / 100,
    amountMinor: parsed.amountMinor,
    currency: 'ZAR',
    barcodeMasked: redactBarcode(parsed.barcode),
    status: 'available',
    ingestedAt: now,
  };
};
