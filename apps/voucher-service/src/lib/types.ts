export type Currency = 'ZAR';

export type PayoutStatus = 'created' | 'submitted' | 'issued' | 'failed' | 'redeemed' | 'expired';

export type ProviderType = 'flash' | 'eclipse';

export type PayoutMethod = '1VOUCHER' | 'CASH_OUT_PIN' | 'FLASH_TOKEN';

export type RecipientProfile = {
  id: string;
  phone: string;
  fullName?: string;
  idNumber?: string;
};

export type PayoutIntent = {
  id: string;
  recipientId: string;
  amount: number; // minor units
  currency: Currency;
  provider: ProviderType;
  reference: string;
  payoutMethod?: PayoutMethod;
  status: PayoutStatus;
  createdAt: string;
};

export type PayoutResult = {
  providerRef: string;
  status: 'issued' | 'failed' | 'queued';
  voucherCode?: string;
  voucherPin?: string;
  voucherSerial?: string;
  voucherExpiry?: string;
  voucherStatus?: string;
  voucherAmount?: number;
  expiresAt?: string;
  receiptUrl?: string;
  error?: string;
};

export type LedgerEntryType = 'credit' | 'debit';

export type LedgerEntry = {
  id: string;
  recipientId: string;
  type: LedgerEntryType;
  amount: number; // minor units
  currency: Currency;
  reference?: string;
  source?: string;
  createdAt: string;
};

export type RecipientBalance = {
  recipientId: string;
  availableBalance: number;
  currency: Currency;
  updatedAt: string;
};
