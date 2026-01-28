import { getSession } from '../auth/session';
import { resolveVoucherApiRoot } from './config';

const API_ROOT = resolveVoucherApiRoot();

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const session = getSession();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const voucherApi = {
  getBalance: (recipientId: string) =>
    request<{ recipientId: string; availableBalance: number; currency: string }>(
      `/recipients/${encodeURIComponent(recipientId)}/balance`
    ),
  requestPayout: (payload: { recipientId: string; amount: number; reference?: string }) =>
    request<{ payoutId: string; status: string; balance?: number }>(`/payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
