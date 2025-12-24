import { z } from 'zod';

// Centralized environment contract; fail fast on missing/invalid values.
export const envSchema = z.object({
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
  PAYMENTS_TABLE_NAME: z.string().min(1, 'PAYMENTS_TABLE_NAME is required'),
  USER_ASSETS_BUCKET: z.string().min(1, 'USER_ASSETS_BUCKET is required'),
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

  FRONTEND_BASE_URL: z.string().url().optional(),
  GUARD_PORTAL_BASE_URL: z.string().url().optional(),

  ALLOWED_ORIGINS: z.string().optional(),
  BODY_LIMIT: z.string().default('2mb'),
  DISABLE_CSP: z.enum(['true', 'false']).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, unknown>): AppEnv => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const formatted = parsed.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, val]) => {
        const entryErrors = Array.isArray(
          (val as { _errors?: string[] })._errors,
        )
          ? (val as { _errors?: string[] })._errors
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
