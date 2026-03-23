export type EclipsePaymentType =
  | 'GLOBAL_PAYMENT_LINK'
  | 'GLOBAL_QRCODE'
  | 'GLOBAL_EMVQRCODE'
  | 'ZA_QRCODE'
  | 'ZA_OZOW';

export type EclipseWithdrawalType =
  | 'ZA_SB_EFT'
  | 'ZA_NEDBANK_EFT'
  | 'ZA_NEDBANK_EFT_IMMEDIATE'
  | 'ZA_PAYCORP_ATM'
  | 'ZA_PNP_CASH';

export interface EclipseAmount {
  currency: string;
  value: number;
}

export interface EclipsePaymentRequest {
  type: EclipsePaymentType;
  amount: number;
  currency: string;
  destinationWalletId?: number | string;
  walletId?: number | string;
  customerId?: number | string;
  externalUniqueId?: string;
  paymentData?: Record<string, any>;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface EclipseWithdrawalRequest {
  type: EclipseWithdrawalType;
  amount: EclipseAmount;
  walletId: string;
  deliverToPhone?: string;
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
    bankName?: string;
  };
  metadata?: Record<string, any>;
}

export interface EclipseWalletRequest {
  type: string;
  name?: string;
  externalUniqueId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface EclipseCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone1?: string;
  externalUniqueId?: string;
}

export interface EclipseCustomerWalletRequest {
  walletTypeId: number;
  name?: string;
  externalUniqueId?: string;
  status?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface EclipseConfig {
  apiBase: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  tenantIdentity?: string;
  tenantPassword?: string;
  webhookSecret?: string;
  callbackBase?: string;
}
