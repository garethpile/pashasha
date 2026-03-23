import { DynamoPayoutStore } from './dynamo-store.js';
import { InMemoryPayoutStore } from './store.js';
import type { PayoutStore } from './store.js';

export function createStore(): PayoutStore {
  const payouts = process.env.PAYOUTS_TABLE_NAME;
  const recipients = process.env.RECIPIENTS_TABLE_NAME;
  const events = process.env.EVENTS_TABLE_NAME;
  const ledger = process.env.LEDGER_TABLE_NAME;

  if (payouts && recipients && events && ledger) {
    return new DynamoPayoutStore(payouts, recipients, events, ledger);
  }

  return new InMemoryPayoutStore();
}
