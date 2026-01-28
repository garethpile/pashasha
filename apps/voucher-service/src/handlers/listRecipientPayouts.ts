import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/response.js';
import { createStore } from '../lib/store-factory.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const recipientId = event.pathParameters?.recipientId;
  if (!recipientId) {
    return json(400, { error: 'missing recipientId' });
  }

  const limitParam = event.queryStringParameters?.limit;
  const limit = limitParam ? Number(limitParam) : 20;
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    return json(400, { error: 'invalid limit' });
  }

  const store = createStore();
  const payouts = await store.listPayoutsByRecipient(recipientId, limit);

  return json(200, { recipientId, payouts });
};
