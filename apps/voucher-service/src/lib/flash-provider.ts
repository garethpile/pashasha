import type { PayoutIntent, PayoutResult, RecipientProfile } from './types.js';
import type { PayoutProvider } from './provider.js';
import { FlashClient } from './flash-client.js';

export class FlashPayoutProvider implements PayoutProvider {
  readonly type = 'flash' as const;

  constructor(private readonly client: FlashClient) {}

  async createRecipient(recipient: RecipientProfile): Promise<string> {
    return this.client.createRecipient(recipient);
  }

  async payout(intent: PayoutIntent): Promise<PayoutResult> {
    return this.client.issueVoucher(intent);
  }

  async getPayoutStatus(providerRef: string): Promise<PayoutResult> {
    return this.client.getVoucherStatus(providerRef);
  }
}
