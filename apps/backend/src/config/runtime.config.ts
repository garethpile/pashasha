import { ConfigType, registerAs } from '@nestjs/config';
import { AppEnv, validateEnv } from './env.schema';

export const loadValidatedEnv = (
  env: Record<string, unknown> = process.env,
): AppEnv => validateEnv(env);

export const runtimeConfig = registerAs('runtime', () => {
  const env = loadValidatedEnv(process.env);
  const guardPortalBase =
    env.GUARD_PORTAL_BASE_URL ??
    env.FRONTEND_BASE_URL ??
    'https://main.d2vxflzymkt19g.amplifyapp.com';
  const normalizedGuardBase = guardPortalBase.replace(/\/$/, '');

  return {
    env,
    awsRegion: env.AWS_DEFAULT_REGION ?? env.AWS_REGION,
    cognitoRegion: env.COGNITO_REGION ?? env.AWS_REGION,
    guardPortalBaseUrl: normalizedGuardBase,
    guardLandingBase: `${normalizedGuardBase}/g?token=`,
  };
});

export type RuntimeConfig = ConfigType<typeof runtimeConfig>;
