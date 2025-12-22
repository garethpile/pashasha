'use client';

import { clearSession, getSession } from '../auth/session';
import { resolveApiRoot } from './config';

const API_ROOT = resolveApiRoot();

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

export type SupportUserInfo = {
  sub?: string;
  email?: string;
  username?: string;
  groups?: string[];
  phone?: string;
  firstName?: string;
  familyName?: string;
  accountNumber?: string;
  walletId?: string;
  profileType?: string;
};

export type SupportComment = {
  id: string;
  authorType: string;
  authorId?: string;
  authorName?: string;
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  supportCode: string;
  customerId: string;
  status: string;
  summary: string;
  details?: string;
  issueType?: string;
  createdAt: string;
  updatedAt?: string;
  user?: SupportUserInfo;
  firstName?: string;
  familyName?: string;
  username?: string;
  cognitoId?: string;
  comments?: SupportComment[];
};

export const supportApi = {
  prepare: () => request<{ supportCode: string; user?: SupportUserInfo }>('/support/prepare'),
  createTicket: (payload: {
    summary: string;
    details?: string;
    issueType?: string;
    status?: string;
    supportCode?: string;
    metadata?: Record<string, any>;
  }) =>
    request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listTickets: (status?: 'ACTIVE' | 'CLOSED') => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<{ items: SupportTicket[] }>(`/support/tickets${qs}`);
  },
  getTicket: (supportCode: string) => request<SupportTicket>(`/support/tickets/${supportCode}`),
  addComment: (supportCode: string, message: string) =>
    request<SupportTicket>(`/support/tickets/${supportCode}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  listTicketsAdmin: (status?: 'ACTIVE' | 'CLOSED', supportCode?: string, familyName?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (supportCode) params.append('supportCode', supportCode);
    if (familyName) params.append('familyName', familyName);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<SupportTicket[]>(`/support/admin/tickets${qs}`);
  },
  getTicketAdmin: (supportCode: string) =>
    request<SupportTicket>(`/support/admin/tickets/${supportCode}`),
  addCommentAdmin: (supportCode: string, message: string) =>
    request<SupportTicket>(`/support/admin/tickets/${supportCode}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  updateStatusAdmin: (supportCode: string, status: string) =>
    request<SupportTicket>(`/support/admin/tickets/${supportCode}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  updateStatusUser: (supportCode: string, status: string) =>
    request<SupportTicket>(`/support/tickets/${supportCode}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};
