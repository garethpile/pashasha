import { KycRecord } from '../../kyc/kyc.types';

export interface CivilServantEntity {
  civilServantId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  familyNameUpper: string;
  email: string;
  emailLower?: string;
  phoneNumber?: string;
  address?: string;
  homeAddress?: string;
  primarySite?: string;
  occupation?: string;
  cognitoUsername?: string;
  status?: 'active' | 'inactive';
  guardToken?: string;
  qrCodeKey?: string;
  photoKey?: string;
  idDocumentKey?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
  kyc?: KycRecord;
  createdAt: string;
  updatedAt: string;
}
