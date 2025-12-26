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

export const validateEnv = (env: Record<string, unknown>): AppEnv => {
  const parsed = envSchema.safeParse(env);
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
