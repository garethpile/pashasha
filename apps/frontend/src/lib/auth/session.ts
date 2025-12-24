export type AuthSession = {
  accessToken: string;
  idToken: string;
  refreshToken?: string | null;
  groups: string[];
};

export const SESSION_STORAGE_KEY = 'pashashapay.auth.session';

// Cookies allow middleware to perform server-side gating for admin routes.
export const SESSION_ID_TOKEN_COOKIE = 'pp-id-token';
export const SESSION_GROUPS_COOKIE = 'pp-groups';

const SESSION_EVENT = 'pashashapay-auth-changed';

const emitSessionChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EVENT));
};

const decodeJwtExp = (token: string): number | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    if (typeof atob !== 'function') return null;
    const parsed = JSON.parse(atob(padded));
    return typeof parsed?.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
};

const writeSessionCookies = (session: AuthSession) => {
  if (typeof document === 'undefined') return;
  const exp = decodeJwtExp(session.idToken);
  const maxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 0) : 3600; // default 1 hour
  const cookieBase = `Path=/; SameSite=Lax; Secure; Max-Age=${maxAge}`;

  document.cookie = `${SESSION_ID_TOKEN_COOKIE}=${encodeURIComponent(session.idToken)}; ${cookieBase}`;
  const groups = (session.groups ?? []).join(',');
  document.cookie = `${SESSION_GROUPS_COOKIE}=${encodeURIComponent(groups)}; ${cookieBase}`;
};

const clearSessionCookies = () => {
  if (typeof document === 'undefined') return;
  const cookieBase = 'Path=/; SameSite=Lax; Secure; Max-Age=0';
  document.cookie = `${SESSION_ID_TOKEN_COOKIE}=; ${cookieBase}`;
  document.cookie = `${SESSION_GROUPS_COOKIE}=; ${cookieBase}`;
};

export const persistSession = (session: AuthSession) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  writeSessionCookies(session);
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
  clearSessionCookies();
  emitSessionChange();
};

export const sessionEventName = SESSION_EVENT;
