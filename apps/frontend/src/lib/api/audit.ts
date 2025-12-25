'use client';

import { clearSession, getSession } from '../auth/session';
import { resolveApiRoot } from './config';

const API_ROOT = resolveApiRoot();

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (!session) {
    throw new Error('No active session');
  }
  headers.Authorization = `Bearer ${session.accessToken}`;
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
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export type AuditLog = {
  auditId: string;
  userId: string;
  actorId?: string;
  actorType?: string;
  eventType: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export const auditApi = {
  list: (params?: { userId?: string; eventType?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.eventType) query.set('eventType', params.eventType);
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<AuditLog[]>(`/audit${suffix}`);
  },
};
