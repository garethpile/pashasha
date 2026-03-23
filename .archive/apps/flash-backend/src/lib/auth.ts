import { createRemoteJWKSet, jwtVerify } from 'jose';

const region = process.env.AWS_REGION ?? 'eu-west-1';
const userPoolId = process.env.USER_POOL_ID ?? '';
const issuer = userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : '';

const jwks = issuer ? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)) : null;

export type AuthClaims = {
  sub?: string;
  username?: string;
  email?: string;
  'cognito:groups'?: string[] | string;
  [key: string]: unknown;
};

export const normalizeGroups = (value: AuthClaims['cognito:groups']): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((g) => g.trim());
  return [];
};

export const getToken = (headers: Record<string, string | undefined>) => {
  const auth = headers.authorization ?? headers.Authorization;
  if (!auth) return undefined;
  const match = auth.match(/Bearer\s+(.+)/i);
  return match?.[1] ?? undefined;
};

export const verifyToken = async (token?: string): Promise<AuthClaims | null> => {
  if (!token || !jwks || !issuer) return null;
  const { payload } = await jwtVerify(token, jwks, { issuer });
  return payload as AuthClaims;
};

export const isAdmin = (claims?: AuthClaims | null) => {
  const groups = normalizeGroups(claims?.['cognito:groups']);
  return groups.some((g) => g.toLowerCase() === 'administrators' || g.toLowerCase() === 'admin');
};
