import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/response.js';
import { createStore } from '../lib/store-factory.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const recipientId = event.pathParameters?.recipientId;
  if (!recipientId) {
    return json(400, { error: 'missing recipientId' });
  }

  const store = createStore();
  const balance = await store.getRecipientBalance(recipientId);

  return json(200, {
    recipientId,
    availableBalance: balance?.availableBalance ?? 0,
    currency: balance?.currency ?? 'ZAR',
  });
};
