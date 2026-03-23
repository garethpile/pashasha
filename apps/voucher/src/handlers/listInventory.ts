import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { assertAdminApiKey, json, redactBarcode, requireEnv } from '../lib/shared';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});
let cachedAdminApiKey: string | undefined;

type InventoryRow = {
  voucherId: string;
  supplierKey: string;
  supplierLabel: string;
  amountMinor: number;
  currency: string;
  status: 'available' | string;
  barcodeLast4: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  ingestedByUserId?: string;
  ingestedByActorId?: string;
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    if (!cachedAdminApiKey) {
      const response = await secrets.send(
        new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_ADMIN_API_KEY_SECRET_ARN') })
      );
      if (!response.SecretString) {
        throw new Error('Voucher admin API key secret is empty.');
      }
      const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
      if (!parsed.apiKey) {
        throw new Error('Voucher admin API key secret missing apiKey.');
      }
      cachedAdminApiKey = parsed.apiKey;
    }

    assertAdminApiKey(
      event.headers['x-admin-api-key'] ?? event.headers['X-Admin-Api-Key'],
      cachedAdminApiKey
    );

    const limitParam = event.queryStringParameters?.limit;
    const limit = Math.max(1, Math.min(Number(limitParam ?? '25'), 100));

    const response = await dynamo.send(
      new ScanCommand({
        TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
        ProjectionExpression:
          'voucherId, supplierKey, supplierLabel, amountMinor, currency, #status, barcodeLast4, #source, createdAt, updatedAt, ingestedByUserId, ingestedByActorId',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#source': 'source',
        },
      })
    );

    const items = ((response.Items ?? []) as InventoryRow[])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((voucher) => ({
        voucherId: voucher.voucherId,
        supplier: voucher.supplierLabel,
        supplierKey: voucher.supplierKey,
        amount: voucher.amountMinor / 100,
        amountMinor: voucher.amountMinor,
        currency: voucher.currency,
        status: voucher.status,
        barcodeMasked: `************${voucher.barcodeLast4}`,
        barcodeLast4: voucher.barcodeLast4,
        source: voucher.source,
        ingestedAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        ingestedByUserId: voucher.ingestedByUserId,
        ingestedByActorId: voucher.ingestedByActorId,
        storage: {
          mode: 'encrypted-at-rest-and-application-encrypted',
          barcodeVisibleToAdmins: false,
        },
      }));

    return json(200, { items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing admin API key.' || message === 'Invalid admin API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
