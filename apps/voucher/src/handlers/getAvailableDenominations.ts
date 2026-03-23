import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { json, requireEnv } from '../lib/shared';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});
let cachedCoreApiKey: string | undefined;

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
  if (provided !== cachedCoreApiKey) {
    throw new Error('Invalid core API key.');
  }
};

type InventoryRow = {
  amountMinor?: number;
  status?: string;
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertCoreApiKey(event.headers['x-core-api-key'] ?? event.headers['X-Core-Api-Key']);

    const response = await dynamo.send(
      new ScanCommand({
        TableName: requireEnv('VOUCHER_INVENTORY_TABLE_NAME'),
        ProjectionExpression: 'amountMinor, #status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        FilterExpression: '#status = :available',
        ExpressionAttributeValues: {
          ':available': 'available',
        },
      })
    );

    const counts = new Map<number, number>();
    for (const item of (response.Items ?? []) as InventoryRow[]) {
      if (item.status !== 'available' || typeof item.amountMinor !== 'number') continue;
      const denomination = item.amountMinor / 100;
      counts.set(denomination, (counts.get(denomination) ?? 0) + 1);
    }

    const denominations = Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([amount, availableCount]) => ({
        amount,
        availableCount,
      }));

    return json(200, {
      denominations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
