export type CurrencyCode = 'ZAR' | 'USD' | 'NGN';

export interface GuardProfile {
  id: string;
  token: string;
  name: string;
  location: string;
  shift: string;
  yearsOfService: number;
  motto: string;
  photoUrl: string;
  payoutChannel: string;
  quickAmounts: number[];
  lastUpdated: string;
}

export interface TipIntentMetadata {
  guardName: string;
  isPresetAmount: boolean;
  clientReference: string | null;
  deviceFingerprint: string | null;
  returnUrl: string | null;
}

export type TipIntentStatus = 'pending' | 'completed' | 'failed';

export interface TipIntent {
  intentId: string;
  guardId: string;
  guardToken: string;
  amount: number;
  currency: CurrencyCode;
  paystackReference: string;
  authorizationUrl: string;
  status: TipIntentStatus;
  expiresAt: string;
  metadata: TipIntentMetadata;
}

export interface CreateTipIntentPayload {
  amount: number;
  currency?: CurrencyCode;
  clientReference?: string;
  deviceFingerprint?: string;
  returnUrl?: string;
}

export interface GuardsClientOptions {
  baseUrl?: string;
  fetchFn?: typeof globalThis.fetch;
  defaultHeaders?: Record<string, string>;
}
