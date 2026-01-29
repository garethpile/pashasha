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
    if (intent.payoutMethod && intent.payoutMethod !== '1VOUCHER') {
      return {
        providerRef: intent.reference,
        status: 'failed',
        error: `payout method ${intent.payoutMethod} not supported yet`,
      };
    }
    return this.client.purchase1Voucher(intent);
  }

  async getPayoutStatus(providerRef: string): Promise<PayoutResult> {
    return this.client.getVoucherStatus(providerRef);
  }
}
