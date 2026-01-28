import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/response.js';
import { createStore } from '../lib/store-factory.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const payoutId = event.pathParameters?.payoutId;
  if (!payoutId) {
    return json(400, { error: 'missing payoutId' });
  }

  const store = createStore();
  const payout = await store.getPayout(payoutId);
  if (!payout) {
    return json(404, { error: 'not found' });
  }

  return json(200, payout);
};
