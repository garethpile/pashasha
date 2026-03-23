import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { assertCoreApiKey, dynamo, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertCoreApiKey(event.headers['x-core-api-key'] ?? event.headers['X-Core-Api-Key']);

    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) {
      return json(400, { message: 'paymentIntentId is required.' });
    }

    const response = await dynamo.send(
      new GetCommand({
        TableName: requireEnv('PAYMENT_INTENTS_TABLE_NAME'),
        Key: { paymentIntentId },
      })
    );

    if (!response.Item) {
      return json(404, { message: 'Payment intent not found.' });
    }

    return json(200, response.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
