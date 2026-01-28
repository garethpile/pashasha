import type { PayoutIntent, PayoutResult, RecipientProfile } from './types.js';

export type FlashClientConfig = {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  apiToken?: string;
  apiKeyHeader?: string;
  apiSecretHeader?: string;
  authScheme?: 'basic' | 'bearer' | 'headers';
};

export class FlashClient {
  constructor(private readonly config: FlashClientConfig) {}

  async createRecipient(recipient: RecipientProfile): Promise<string> {
    const response = await this.request('/recipients', {
      method: 'POST',
      body: JSON.stringify({
        externalId: recipient.id,
        phone: recipient.phone,
        fullName: recipient.fullName,
        idNumber: recipient.idNumber,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message ?? 'flash create recipient failed');
    }

    return payload.recipientId as string;
  }

  async issueVoucher(intent: PayoutIntent): Promise<PayoutResult> {
    const response = await this.request('/vouchers', {
      method: 'POST',
      body: JSON.stringify({
        externalRef: intent.id,
        recipientId: intent.recipientId,
        amount: intent.amount,
        currency: intent.currency,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return {
        providerRef: payload?.reference ?? intent.id,
        status: 'failed',
        error: payload?.message ?? 'flash voucher issuance failed',
      };
    }

    return {
      providerRef: payload.reference ?? intent.id,
      status: 'issued',
      voucherCode: payload.voucherCode,
      expiresAt: payload.expiresAt,
      receiptUrl: payload.receiptUrl,
    };
  }

  async getVoucherStatus(providerRef: string): Promise<PayoutResult> {
    const response = await this.request(`/vouchers/${providerRef}`, {
      method: 'GET',
    });

    const payload = await response.json();
    if (!response.ok) {
      return {
        providerRef,
        status: 'failed',
        error: payload?.message ?? 'flash status lookup failed',
      };
    }

    return {
      providerRef,
      status: payload.status ?? 'issued',
      voucherCode: payload.voucherCode,
      expiresAt: payload.expiresAt,
      receiptUrl: payload.receiptUrl,
    };
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = new Headers(init.headers ?? {});

    if (!headers.has('content-type') && init.body) {
      headers.set('content-type', 'application/json');
    }

    const scheme = this.config.authScheme ?? 'headers';
    if (scheme === 'basic' && this.config.apiKey && this.config.apiSecret) {
      const token = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString(
        'base64'
      );
      headers.set('authorization', `Basic ${token}`);
    } else if (scheme === 'bearer' && this.config.apiToken) {
      headers.set('authorization', `Bearer ${this.config.apiToken}`);
    } else {
      if (this.config.apiKey) {
        headers.set(this.config.apiKeyHeader ?? 'x-api-key', this.config.apiKey);
      }
      if (this.config.apiSecret) {
        headers.set(this.config.apiSecretHeader ?? 'x-api-secret', this.config.apiSecret);
      }
    }

    return fetch(url, { ...init, headers });
  }
}
