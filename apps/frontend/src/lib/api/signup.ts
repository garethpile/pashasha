import { resolveApiRoot } from './config';

const API_ROOT = resolveApiRoot();

export type SignupRequest = {
  firstName: string;
  familyName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  role: 'CUSTOMER' | 'CIVIL_SERVANT';
  occupation?: string;
  otherOccupation?: string;
  password: string;
};

export type SignupResponse = { status: string; profileId?: string };

const parseErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (Array.isArray(data?.message)) {
      return data.message.join(' \u2022 ');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || 'Request failed';
  }
};

export const checkEmailPublic = async (
  email: string
): Promise<{ exists: boolean; type?: 'civil-servant' | 'customer' }> => {
  const response = await fetch(`${API_ROOT}/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message || 'Unable to check email');
  }
  return (await response.json()) as { exists: boolean; type?: 'civil-servant' | 'customer' };
};

export const signup = async (payload: SignupRequest): Promise<SignupResponse> => {
  // Public signup just enqueues the provisioning workflow; Cognito is created
  // by the backend step function, not by the client.
  const response = await fetch(`${API_ROOT}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message || 'Unable to complete signup');
  }

  return (await response.json()) as SignupResponse;
};
