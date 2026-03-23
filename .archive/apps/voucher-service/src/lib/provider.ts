import type { PayoutIntent, PayoutResult, ProviderType, RecipientProfile } from './types.js';

export interface PayoutProvider {
  type: ProviderType;
  createRecipient(recipient: RecipientProfile): Promise<string>;
  payout(intent: PayoutIntent): Promise<PayoutResult>;
  getPayoutStatus(providerRef: string): Promise<PayoutResult>;
}
