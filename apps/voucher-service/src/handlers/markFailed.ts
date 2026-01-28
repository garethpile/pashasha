import type { Handler } from 'aws-lambda';
import { createStore } from '../lib/store-factory.js';

export const handler: Handler = async (event) => {
  const payoutId = event?.payoutId as string | undefined;
  if (payoutId) {
    const store = createStore();
    await store.updatePayoutStatus(payoutId, 'failed');
  }

  return { ok: true };
};
