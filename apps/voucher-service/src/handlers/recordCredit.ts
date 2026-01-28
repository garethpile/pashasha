import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/response.js';
import { newId } from '../lib/id.js';
import type { LedgerEntry } from '../lib/types.js';
import { createStore } from '../lib/store-factory.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return json(400, { error: 'missing body' });
  }

  const payload = JSON.parse(event.body) as {
    recipientId?: string;
    amount?: number;
    reference?: string;
    source?: string;
  };

  if (!payload.recipientId || !payload.amount || payload.amount <= 0) {
    return json(400, { error: 'invalid recipientId or amount' });
  }

  const store = createStore();
  const balance = await store.adjustRecipientBalance(payload.recipientId, payload.amount, 'ZAR');

  const entry: LedgerEntry = {
    id: newId('ledger'),
    recipientId: payload.recipientId,
    type: 'credit',
    amount: payload.amount,
    currency: 'ZAR',
    reference: payload.reference,
    source: payload.source ?? 'tip',
    createdAt: new Date().toISOString(),
  };
  await store.recordLedgerEntry(entry);

  return json(200, {
    recipientId: payload.recipientId,
    balance: balance.availableBalance,
  });
};
