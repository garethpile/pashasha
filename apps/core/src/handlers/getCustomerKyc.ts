import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { findProfileByCognitoIdentity, json } from '../lib/shared';

type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

type KycDocumentRecord = {
  bucket: string;
  key: string;
  contentType: string;
  fileName?: string;
  size?: number;
  uploadedAt: string;
};

type KycRecord = {
  status: KycStatus;
  documents: Partial<Record<'country-id' | 'passport' | 'proof-of-address', KycDocumentRecord>>;
  updatedAt: string;
};

const normalizeKycRecord = (profile: Record<string, unknown>): KycRecord => {
  const existing = profile.kyc as Partial<KycRecord> | undefined;
  if (existing?.status && existing?.documents) {
    return {
      status: existing.status,
      documents: existing.documents,
      updatedAt: existing.updatedAt ?? new Date().toISOString(),
    };
  }

  return {
    status: 'not_started',
    documents: {},
    updatedAt: String(profile.updatedAt ?? '').trim() || new Date().toISOString(),
  };
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    return json(200, normalizeKycRecord(profile));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
