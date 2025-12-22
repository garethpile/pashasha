export type AuthSession = {
  accessToken: string;
  idToken: string;
  refreshToken?: string | null;
  groups: string[];
};

export const SESSION_STORAGE_KEY = 'pashashapay.auth.session';

const SESSION_EVENT = 'pashashapay-auth-changed';

const emitSessionChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const persistSession = (session: AuthSession) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  emitSessionChange();
};

export const getSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  emitSessionChange();
};

export const sessionEventName = SESSION_EVENT;
