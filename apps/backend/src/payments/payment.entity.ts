export interface PaymentRecord {
  paymentId: string;
  externalId?: string | null;
  status: string;
  amount: number;
  currency: string;
  feeAmount?: number;
  paymentType?: string;
  walletId?: string;
  customerId?: string;
  civilServantId?: string;
  guardToken?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
  source?: 'init' | 'webhook' | 'reconcile';
  associatedPaymentId?: string;
  metadata?: Record<string, any>;
  raw?: Record<string, any>;
  balance?: number;
}
