'use client';

import { clearSession, getSession } from '../auth/session';
import { resolveApiRoot } from './config';

const API_ROOT = resolveApiRoot();

const request = async <T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> => {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (requireAuth) {
    if (!session) {
      throw new Error('No active session');
    }
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
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
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

export const adminApi = {
  searchCivilServants: (params: { accountNumber?: string; familyName?: string }) => {
    const query = new URLSearchParams();
    if (params.accountNumber) query.set('accountNumber', params.accountNumber);
    if (params.familyName) query.set('familyName', params.familyName);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/civil-servants${suffix}`);
  },
  getCivilServant: (id: string) => request(`/civil-servants/${id}`),
  createCivilServant: (payload: {
    firstName: string;
    familyName: string;
    email: string;
    phoneNumber?: string;
    occupation?: string;
    address?: string;
    primarySite?: string;
    homeAddress?: string;
  }) =>
    request<{ status: string; profileId: string }>('/admin/users/civil-servants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkEmail: (email: string) => {
    const query = new URLSearchParams({ email });
    return request<{ exists: boolean; type?: 'civil-servant' | 'customer' }>(
      `/admin/users/check-email?${query}`
    );
  },
  deleteCivilServant: (id: string) =>
    request(`/admin/users/civil-servants/${id}`, { method: 'DELETE' }),
  generateCivilServantQr: (id: string) =>
    request(`/civil-servants/${id}/guard-token`, { method: 'POST' }),
  getCivilServantQr: (id: string) => request<{ url: string }>(`/civil-servants/${id}/qr-code`),
  getCivilServantPayout: (id: string) => request(`/civil-servants/${id}/payout`),
  getCivilServantTransactions: (id: string) => request(`/civil-servants/${id}/transactions`),
  getCivilServantPendingTransactions: (
    id: string,
    params?: { offset?: number; limit?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/civil-servants/${id}/transactions/pending${suffix}`);
  },
  updateCivilServant: (id: string, payload: Record<string, any>) =>
    request(`/civil-servants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getCustomerTransactions: (id: string, params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/customers/${id}/transactions${suffix}`);
  },
  getCustomerPendingTransactions: (id: string, params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/customers/${id}/transactions/pending${suffix}`);
  },
  updateCustomer: (id: string, payload: Record<string, any>) =>
    request(`/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  searchCustomers: (params: { accountNumber?: string; familyName?: string }) => {
    const query = new URLSearchParams();
    if (params.accountNumber) query.set('accountNumber', params.accountNumber);
    if (params.familyName) query.set('familyName', params.familyName);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/customers${suffix}`);
  },
  getCustomer: (id: string) => request(`/customers/${id}`),
  createCustomer: (payload: {
    firstName: string;
    familyName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  }) =>
    request<{ status: string; profileId: string }>('/admin/users/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteCustomer: (id: string) => request(`/admin/users/customers/${id}`, { method: 'DELETE' }),
  getCustomerWallet: (id: string) => request(`/customers/${id}/wallet`),
  listAdministrators: () => request('/admin/users/administrators'),
  createAdministrator: (payload: {
    firstName: string;
    familyName: string;
    email: string;
    phoneNumber?: string;
    password?: string;
  }) =>
    request<{ temporaryPassword: string; sub: string; username: string }>(
      '/admin/users/administrators',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  deleteAdministrator: (username: string) =>
    request(`/admin/users/administrators/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    }),

  getCustomerKyc: (id: string) => request(`/customers/${id}/kyc`),
  presignCustomerKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { contentType: string; fileName?: string }
  ) =>
    request<{ uploadUrl: string; key: string; bucket: string }>(
      `/customers/${id}/kyc/documents/${documentType}/presign`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  confirmCustomerKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { bucket: string; key: string; contentType: string; fileName?: string; size?: number }
  ) =>
    request(`/customers/${id}/kyc/documents/${documentType}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCustomerKycDocumentUrl: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address'
  ) => request<{ url: string }>(`/customers/${id}/kyc/documents/${documentType}`),
  deleteCustomerKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address'
  ) => request(`/customers/${id}/kyc/documents/${documentType}`, { method: 'DELETE' }),

  getCivilServantKyc: (id: string) => request(`/civil-servants/${id}/kyc`),
  presignCivilServantKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { contentType: string; fileName?: string }
  ) =>
    request<{ uploadUrl: string; key: string; bucket: string }>(
      `/civil-servants/${id}/kyc/documents/${documentType}/presign`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  confirmCivilServantKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address',
    payload: { bucket: string; key: string; contentType: string; fileName?: string; size?: number }
  ) =>
    request(`/civil-servants/${id}/kyc/documents/${documentType}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCivilServantKycDocumentUrl: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address'
  ) => request<{ url: string }>(`/civil-servants/${id}/kyc/documents/${documentType}`),
  deleteCivilServantKycDocument: (
    id: string,
    documentType: 'country-id' | 'passport' | 'proof-of-address'
  ) => request(`/civil-servants/${id}/kyc/documents/${documentType}`, { method: 'DELETE' }),
};
