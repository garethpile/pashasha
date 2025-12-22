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

export type CustomerProfileResponse = {
  customerId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
};

export const customerApi = {
  getProfile: () => request<CustomerProfileResponse>('/customers/me'),
  getTransactions: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/customers/me/transactions${qs}`);
  },
  getSentTransactions: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/customers/me/transactions/sent${qs}`);
  },
  getWalletInfo: () =>
    request<{
      walletId: string;
      balance: number;
      availableBalance?: number;
      currentBalance?: number;
      currency: string;
    }>('/customers/me/wallet'),
  updateProfile: (payload: {
    firstName?: string;
    familyName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  }) =>
    request('/customers/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  searchCivilServants: (params: {
    firstName?: string;
    familyName?: string;
    occupation?: string;
    site?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.firstName) query.append('firstName', params.firstName);
    if (params.familyName) query.append('familyName', params.familyName);
    if (params.occupation) query.append('occupation', params.occupation);
    if (params.site) query.append('site', params.site);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<
      {
        civilServantId: string;
        firstName: string;
        familyName: string;
        occupation: string;
        primarySite: string;
        guardToken?: string;
        accountNumber?: string;
        status?: string;
      }[]
    >(`/civil-servants/lookup${qs}`);
  },

  getKyc: () =>
    request<{
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      documents: Record<string, any>;
      updatedAt: string;
    }>('/customers/me/kyc'),
  presignKycDocument: (
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { contentType: string; fileName?: string }
  ) =>
    request<{ uploadUrl: string; key: string; bucket: string }>(
      `/customers/me/kyc/documents/${documentType}/presign`,
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
    request(`/customers/me/kyc/documents/${documentType}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getKycDocumentUrl: (documentType: 'country-id' | 'passport' | 'proof-of-address') =>
    request<{ url: string }>(`/customers/me/kyc/documents/${documentType}`),
  deleteKycDocument: (documentType: 'country-id' | 'passport' | 'proof-of-address') =>
    request(`/customers/me/kyc/documents/${documentType}`, { method: 'DELETE' }),
};
