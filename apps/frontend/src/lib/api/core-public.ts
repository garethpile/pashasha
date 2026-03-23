import { resolveCoreApiRoot } from './config';

const API_ROOT = resolveCoreApiRoot();

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === 'object' &&
      typeof (payload as { message?: string }).message === 'string'
    ) {
      throw new Error((payload as { message: string }).message);
    }
    if (typeof payload === 'string' && payload.trim().length > 0) {
      throw new Error(payload);
    }
    throw new Error(`Request failed (${response.status})`);
  }

  return payload as T;
};

export type PublicCivilServantRecipient = {
  civilServantId: string;
  displayName: string;
  occupation?: string;
  primarySite?: string;
  department?: string;
  station?: string;
  qrToken: string;
  availableVoucherDenominations: number[];
};

export type LookupCivilServantResponse = {
  recipient: PublicCivilServantRecipient;
};

export type PublicPaymentIntentResponse = {
  paymentIntentId: string;
  status: string;
  paymentEngine: string;
  amount?: number;
  voucherAmount?: number;
  customerChargeAmount?: number;
  paymentProviderFeeAmount?: number;
  platformFeeAmount?: number;
  currency?: string;
  civilServantId?: string;
  checkoutReference?: string;
  redirectUrl?: string;
  expiresAt?: string;
  transactionId?: string | null;
  voucherAllocation?: {
    status: string;
    deliveryStatus: string;
  };
};

export const corePublicApi = {
  lookupCivilServant: (qrToken: string) =>
    request<LookupCivilServantResponse>(
      `/api/public/civil-servants/lookup?qrToken=${encodeURIComponent(qrToken)}`
    ),
  lookupCivilServantById: (publicId: string) =>
    request<LookupCivilServantResponse>(
      `/api/public/civil-servants/lookup?publicId=${encodeURIComponent(publicId)}`
    ),
  createPaymentIntent: (payload: {
    civilServantId: string;
    voucherDenomination: number;
    paymentEngine?: 'ozow';
    customer?: {
      customerId?: string;
      firstName?: string;
      familyName?: string;
      email?: string;
      phoneNumber?: string;
    };
  }) =>
    request<PublicPaymentIntentResponse>('/api/public/payment-intents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPaymentIntent: (paymentIntentId: string) =>
    request<PublicPaymentIntentResponse>(
      `/api/public/payment-intents/${encodeURIComponent(paymentIntentId)}`
    ),
};
