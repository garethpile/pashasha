import { clearSession, getSession } from '../auth/session';
import { resolveApiRoot } from './config';

const API_ROOT = resolveApiRoot();

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${session.accessToken}`,
  };

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export type GuardProfileResponse = {
  civilServantId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  homeAddress?: string;
  occupation?: string;
  primarySite?: string;
  status?: string;
  guardToken?: string;
  qrCodeKey?: string;
  eclipseWalletId?: string;
};

export const guardApi = {
  getProfile: () => request<GuardProfileResponse>('/civil-servants/me'),
  getQrCode: () => request<{ url: string }>('/civil-servants/me/qr-code'),
  getTransactions: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/civil-servants/me/transactions${qs}`);
  },
  getPendingTransactions: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/civil-servants/me/transactions/pending${qs}`);
  },
  getPayoutInfo: () =>
    request<{
      walletId: string;
      balance: number;
      availableBalance?: number;
      currentBalance?: number;
      currency: string;
    }>('/civil-servants/me/payout'),
  updateProfile: (payload: Record<string, any>) =>
    request('/civil-servants/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  requestPayout: (payload: { amount: number; method: 'ATM_CASH' | 'PNP_CASH' | 'PNP_SPEND' }) =>
    request<any>('/civil-servants/me/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getKyc: () =>
    request<{
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      documents: Record<string, any>;
      updatedAt: string;
    }>('/civil-servants/me/kyc'),
  presignKycDocument: (
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { contentType: string; fileName?: string }
  ) =>
    request<{ uploadUrl: string; key: string; bucket: string }>(
      `/civil-servants/me/kyc/documents/${documentType}/presign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),
  confirmKycDocument: (
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: {
      bucket: string;
      key: string;
      contentType: string;
      fileName?: string;
      size?: number;
    }
  ) =>
    request(`/civil-servants/me/kyc/documents/${documentType}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getKycDocumentUrl: (documentType: 'country-id' | 'passport' | 'proof-of-address') =>
    request<{ url: string }>(`/civil-servants/me/kyc/documents/${documentType}`),
  deleteKycDocument: (documentType: 'country-id' | 'passport' | 'proof-of-address') =>
    request(`/civil-servants/me/kyc/documents/${documentType}`, { method: 'DELETE' }),
};
