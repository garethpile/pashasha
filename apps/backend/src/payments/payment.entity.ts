export interface PaymentRecord {
  paymentId: string;
  externalId?: string | number | null;
  status: string;
  amount: number;
  currency: string;
  feeAmount?: number;
  paymentType?: string;
  walletId?: string | number;
  customerId?: string | number;
  civilServantId?: string | number;
  guardToken?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'init' | 'webhook' | 'reconcile';
  associatedPaymentId?: string | number;
  metadata?: Record<string, unknown>;
  raw?: Record<string, unknown>;
  balance?: number;
}
