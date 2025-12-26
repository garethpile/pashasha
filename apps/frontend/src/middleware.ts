import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ADMIN_GROUPS = ['administrators', 'admin'];

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_ROOT ||
  'https://d219w61biha52r.cloudfront.net';

const normalizeGroup = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');

const decodeJwtPayload = (token: string): any | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const hasAdminGroup = (groups: string[]) =>
  groups.map(normalizeGroup).some((g) => ADMIN_GROUPS.includes(g));

const buildSecurityHeaders = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://d219w61biha52r.cloudfront.net https://*.amazonaws.com",
    `connect-src 'self' ${API_ORIGIN} https://*.amazonaws.com http://localhost:4000`,
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Origin-Agent-Cluster': '?1',
  };
};

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Apply security headers universally (excluding static assets via matcher below).
  const securityHeaders = buildSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const isAdminRoute = pathname.startsWith('/admin');
  if (!isAdminRoute) {
    return response;
  }

  const token = req.cookies.get('pp-id-token')?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const tokenGroups: string[] = Array.isArray(payload?.['cognito:groups'])
    ? payload['cognito:groups']
    : [];
  const groupsCookie = req.cookies.get('pp-groups')?.value ?? '';
  const cookieGroups = groupsCookie
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
  const mergedGroups = tokenGroups.length > 0 ? tokenGroups : cookieGroups;
  const isExpired = payload?.exp ? payload.exp * 1000 < Date.now() : false;

  const allowed = token && !isExpired && hasAdminGroup(mergedGroups);
  if (!allowed) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)'],
};
