import { z } from 'zod';

// Centralized environment contract; fail fast on missing/invalid values.
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    AWS_REGION: z.string().min(1).default('eu-west-1'),
    AWS_DEFAULT_REGION: z.string().min(1).optional(),

    USER_POOL_ID: z.string().min(1, 'USER_POOL_ID is required'),
    USER_POOL_CLIENT_ID: z.string().min(1, 'USER_POOL_CLIENT_ID is required'),
    COGNITO_REGION: z.string().min(1).optional(),

    CUSTOMERS_TABLE_NAME: z.string().min(1, 'CUSTOMERS_TABLE_NAME is required'),
    CIVIL_SERVANTS_TABLE_NAME: z
      .string()
      .min(1, 'CIVIL_SERVANTS_TABLE_NAME is required'),
    ADMINISTRATORS_TABLE_NAME: z
      .string()
      .min(1, 'ADMINISTRATORS_TABLE_NAME is required'),
    AUDIT_TABLE_NAME: z.string().min(1, 'AUDIT_TABLE_NAME is required'),
    PAYMENTS_TABLE_NAME: z.string().min(1, 'PAYMENTS_TABLE_NAME is required'),
    USER_ASSETS_BUCKET: z.string().min(1, 'USER_ASSETS_BUCKET is required'),
    KYC_ASSETS_BUCKET: z.string().optional(),
    QR_ASSETS_BUCKET: z.string().optional(),
    COUNTER_TABLE_NAME: z.string().min(1, 'COUNTER_TABLE_NAME is required'),

    PAYMENTS_SNS_TOPIC_ARN: z
      .string()
      .min(1, 'PAYMENTS_SNS_TOPIC_ARN is required'),
    CUSTOMER_PAYMENT_SFN_ARN: z
      .string()
      .min(1, 'CUSTOMER_PAYMENT_SFN_ARN is required'),
    SIGNUP_SNS_TOPIC_ARN: z.string().min(1, 'SIGNUP_SNS_TOPIC_ARN is required'),
    ACCOUNT_WORKFLOW_ARN: z.string().min(1, 'ACCOUNT_WORKFLOW_ARN is required'),
    ACCOUNT_WORKFLOW_ARN_CIVIL: z
      .string()
      .min(1, 'ACCOUNT_WORKFLOW_ARN_CIVIL is required'),
    ACCOUNT_WORKFLOW_ARN_CUSTOMER: z
      .string()
      .min(1, 'ACCOUNT_WORKFLOW_ARN_CUSTOMER is required'),
    ACCOUNT_WORKFLOW_ARN_ADMINISTRATOR: z
      .string()
      .min(1, 'ACCOUNT_WORKFLOW_ARN_ADMINISTRATOR is required'),
    TENANT_WALLET_ID: z.string().optional(),

    SUPPORT_TOPIC_ARN: z.string().min(1, 'SUPPORT_TOPIC_ARN is required'),
    SUPPORT_TABLE_NAME: z.string().min(1, 'SUPPORT_TABLE_NAME is required'),

    // If provided, this should contain the entire Secrets Manager JSON payload for Eclipse.
    // We merge recognized keys into the env before validation.
    ECLIPSE_SECRET_JSON: z.string().min(1).optional(),

    // Eclipse payments API
    ECLIPSE_API_BASE: z
      .string()
      .url()
      .default('https://sandbox.api.eftcorp.co.za'),
    ECLIPSE_TENANT_ID: z.string().min(1, 'ECLIPSE_TENANT_ID is required'),
    ECLIPSE_CLIENT_ID: z.string().min(1).optional(),
    ECLIPSE_CLIENT_SECRET: z.string().min(1).optional(),
    ECLIPSE_TENANT_IDENTITY: z.string().min(1).optional(),
    ECLIPSE_TENANT_PASSWORD: z.string().min(1).optional(),
    ECLIPSE_CALLBACK_BASE: z.string().url().optional(),
    ECLIPSE_WEBHOOK_SECRET: z
      .string()
      .min(1, 'ECLIPSE_WEBHOOK_SECRET is required'),

    FRONTEND_BASE_URL: z.string().url().optional(),
    GUARD_PORTAL_BASE_URL: z.string().url().optional(),

    ALLOWED_ORIGINS: z.string().optional(),
    BODY_LIMIT: z.string().default('2mb'),
    DISABLE_CSP: z.enum(['true', 'false']).optional(),

    // Guard QR/token controls
    GUARD_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(24 * 60 * 60),
  })
  .superRefine((data, ctx) => {
    const hasClientCreds =
      Boolean(data.ECLIPSE_CLIENT_ID) && Boolean(data.ECLIPSE_CLIENT_SECRET);
    const hasTenantLogin =
      Boolean(data.ECLIPSE_TENANT_IDENTITY) &&
      Boolean(data.ECLIPSE_TENANT_PASSWORD);

    if (!hasClientCreds && !hasTenantLogin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ECLIPSE_CLIENT_ID'],
        message:
          'Provide ECLIPSE_CLIENT_ID/ECLIPSE_CLIENT_SECRET or ECLIPSE_TENANT_IDENTITY/ECLIPSE_TENANT_PASSWORD',
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pickFirst = (
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = asNonEmptyString(obj[key]);
    if (value) return value;
  }
  return undefined;
};

const mergeEclipseSecretIntoEnv = (
  env: Record<string, unknown>,
): Record<string, unknown> => {
  const raw = asNonEmptyString(env.ECLIPSE_SECRET_JSON);
  if (!raw) return env;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'Invalid environment configuration: ECLIPSE_SECRET_JSON: invalid JSON',
    );
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      'Invalid environment configuration: ECLIPSE_SECRET_JSON: must be a JSON object',
    );
  }

  const secret = parsed as Record<string, unknown>;

  const candidates = {
    ECLIPSE_API_BASE: [
      'ECLIPSE_API_BASE',
      'NEXT_ECLIPSE_API_BASE',
      'NEXT_ECLIPSE_BASE_URL',
      'NEXT_ECLIPSE_BASE',
    ],
    ECLIPSE_TENANT_ID: ['ECLIPSE_TENANT_ID', 'NEXT_ECLIPSE_TENANT_ID'],
    ECLIPSE_CLIENT_ID: ['ECLIPSE_CLIENT_ID', 'NEXT_ECLIPSE_CLIENT_ID'],
    ECLIPSE_CLIENT_SECRET: [
      'ECLIPSE_CLIENT_SECRET',
      'NEXT_ECLIPSE_CLIENT_SECRET',
    ],
    ECLIPSE_TENANT_IDENTITY: [
      'ECLIPSE_TENANT_IDENTITY',
      'NEXT_ECLIPSE_TENANT_IDENTITY',
    ],
    ECLIPSE_TENANT_PASSWORD: [
      'ECLIPSE_TENANT_PASSWORD',
      'NEXT_ECLIPSE_TENANT_PASSWORD',
    ],
    ECLIPSE_CALLBACK_BASE: [
      'ECLIPSE_CALLBACK_BASE',
      'NEXT_ECLIPSE_CALLBACK_BASE',
    ],
    ECLIPSE_WEBHOOK_SECRET: [
      'ECLIPSE_WEBHOOK_SECRET',
      'NEXT_ECLIPSE_WEBHOOK_SECRET',
    ],
  };

  const merged: Record<string, unknown> = { ...env };
  for (const [targetKey, keys] of Object.entries(candidates)) {
    if (asNonEmptyString(merged[targetKey])) continue;
    const candidate = pickFirst(secret, keys);
    if (candidate) merged[targetKey] = candidate;
  }

  return merged;
};

export const validateEnv = (env: Record<string, unknown>): AppEnv => {
  const mergedEnv = mergeEclipseSecretIntoEnv(env);
  const parsed = envSchema.safeParse(mergedEnv);
  if (!parsed.success) {
    const formatted = parsed.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, val]) => {
        const entryErrors: string[] = Array.isArray(
          (val as { _errors?: string[] })._errors,
        )
          ? ((val as { _errors?: string[] })._errors as string[])
          : [];
        const message =
          entryErrors.length > 0 ? entryErrors.join(', ') : 'invalid';
        return `${key}: ${message}`;
      });
    throw new Error(
      `Invalid environment configuration: ${messages.join(' | ')}`,
    );
  }

  const data = parsed.data;
  return {
    ...data,
    AWS_DEFAULT_REGION: data.AWS_DEFAULT_REGION ?? data.AWS_REGION,
    COGNITO_REGION: data.COGNITO_REGION ?? data.AWS_REGION,
  };
};
