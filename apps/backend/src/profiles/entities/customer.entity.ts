import { KycRecord } from '../../kyc/kyc.types';

export interface CustomerEntity {
  customerId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  familyNameUpper: string;
  email: string;
  emailLower?: string;
  phoneNumber?: string;
  address?: string;
  cognitoUsername?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
  status?: 'active' | 'inactive';
  kyc?: KycRecord;
  createdAt: string;
  updatedAt: string;
}
