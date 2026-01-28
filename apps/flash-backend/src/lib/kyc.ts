export type KycProfileType = 'customer' | 'civil-servant';
export type KycDocumentType = 'country-id' | 'passport' | 'proof-of-address';
export type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export type KycDocumentRecord = {
  bucket: string;
  key: string;
  contentType: string;
  fileName?: string;
  size?: number;
  uploadedAt: string;
};

export type KycRecord = {
  status: KycStatus;
  documents: Partial<Record<KycDocumentType, KycDocumentRecord>>;
  updatedAt: string;
};

const ALL_KYC_DOCUMENT_TYPES: readonly KycDocumentType[] = [
  'country-id',
  'passport',
  'proof-of-address',
] as const;

export const assertKycDocumentType = (value: string): KycDocumentType => {
  if ((ALL_KYC_DOCUMENT_TYPES as readonly string[]).includes(value)) {
    return value as KycDocumentType;
  }
  throw new Error(`Invalid KYC documentType: ${value}`);
};
