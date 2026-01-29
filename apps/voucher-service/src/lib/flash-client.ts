import type { PayoutIntent, PayoutResult } from './types.js';
import { buildMockPurchaseResponse } from './flash-mock.js';

type AccessToken = {
  token: string;
  expiresAt: number;
};

export type FlashClientConfig = {
  baseUrl: string;
  tokenUrl: string;
  apiKey?: string;
  accountNumber?: string;
  useMock?: boolean;
};

export class FlashClient {
  private accessToken: AccessToken | null = null;

  constructor(private readonly config: FlashClientConfig) {}

  async purchase1Voucher(intent: PayoutIntent): Promise<PayoutResult> {
    if (this.config.useMock) {
      const mock = buildMockPurchaseResponse({
        reference: intent.reference,
        accountNumber: this.config.accountNumber ?? 'TEST-ACCOUNT',
        amountCents: Math.round(intent.amount * 100),
      });
      return this.toResult(mock);
    }

    const token = await this.getAccessToken();
    const response = await this.request('/aggregation/4.0/1voucher/purchase', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reference: intent.reference,
        accountNumber: this.config.accountNumber,
        amount: Math.round(intent.amount * 100),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.responseCode !== 0) {
      return {
        providerRef: payload?.reference ?? intent.reference,
        status: 'failed',
        error: payload?.responseMessage ?? 'flash 1voucher purchase failed',
      };
    }

    return this.toResult(payload);
  }

  async getVoucherStatus(providerRef: string): Promise<PayoutResult> {
    return {
      providerRef,
      status: 'issued',
    };
  }

  private toResult(payload: any): PayoutResult {
    return {
      providerRef: payload?.reference ?? String(payload?.transactionId ?? ''),
      status: 'issued',
      voucherCode: payload?.voucher?.pin ?? payload?.voucher?.serialNumber,
      voucherPin: payload?.voucher?.pin,
      voucherSerial: payload?.voucher?.serialNumber,
      voucherExpiry: payload?.voucher?.expiryDate,
      voucherStatus: payload?.voucher?.status,
      voucherAmount: payload?.voucher?.amount,
    };
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.accessToken.expiresAt > now + 10_000) {
      return this.accessToken.token;
    }

    if (!this.config.apiKey) {
      throw new Error('flash api key not configured');
    }

    const body = new URLSearchParams({ grant_type: 'client_credentials' });
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.access_token) {
      throw new Error(payload?.error_description ?? 'unable to fetch flash token');
    }

    const expiresIn = Number(payload.expires_in ?? 3600);
    this.accessToken = {
      token: payload.access_token,
      expiresAt: now + expiresIn * 1000,
    };
    return this.accessToken.token;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = new Headers(init.headers ?? {});

    if (!headers.has('content-type') && init.body) {
      headers.set('content-type', 'application/json');
    }
    headers.set('accept', 'application/json');

    return fetch(url, { ...init, headers });
  }
}
