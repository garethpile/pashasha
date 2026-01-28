export type Currency = 'ZAR';

export type PayoutStatus = 'created' | 'submitted' | 'issued' | 'failed' | 'redeemed' | 'expired';

export type ProviderType = 'flash' | 'eclipse';

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
  status: PayoutStatus;
  createdAt: string;
};

export type PayoutResult = {
  providerRef: string;
  status: 'issued' | 'failed' | 'queued';
  voucherCode?: string;
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
