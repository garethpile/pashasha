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
  primarySite?: string;
  password: string;
};

export type DeliveryDetails = {
  destination?: string;
  medium?: string;
};
export type SignupResponse = {
  status: string;
  profileId?: string;
  username?: string;
  nextStep?: string;
  codeDelivery?: DeliveryDetails;
};

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

export const confirmSignup = async (payload: {
  username: string;
  confirmationCode: string;
}): Promise<{ status: string; nextStep?: string }> => {
  const response = await fetch(`${API_ROOT}/auth/confirm-signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message || 'Unable to confirm signup');
  }

  return (await response.json()) as { status: string; nextStep?: string };
};

export const resendSignupCode = async (
  username: string
): Promise<{ status: string; codeDelivery?: DeliveryDetails }> => {
  const response = await fetch(`${API_ROOT}/auth/resend-signup-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message || 'Unable to resend verification code');
  }

  return (await response.json()) as { status: string; codeDelivery?: DeliveryDetails };
};
