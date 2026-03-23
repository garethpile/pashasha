import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secrets = new SecretsManagerClient({});

let cachedCoreApiKey: string | undefined;
let cachedOzowConfig:
  | {
      siteCode?: string;
      privateKey?: string;
      apiKey?: string;
      callbackSecret?: string;
    }
  | undefined;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const generatePaymentIntentId = () => `pi_${randomUUID()}`;

export const generateCheckoutReference = () => `tip_${randomUUID()}`;
export const generateBankReference = (paymentIntentId: string) =>
  paymentIntentId
    .replace(/^pi_/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 20);

export const assertCoreApiKey = async (provided?: string): Promise<void> => {
  if (!provided) {
    throw new Error('Missing core API key.');
  }

  if (!cachedCoreApiKey) {
    const response = await secrets.send(
      new GetSecretValueCommand({ SecretId: requireEnv('PAYMENT_CORE_API_KEY_SECRET_ARN') })
    );
    if (!response.SecretString) {
      throw new Error('Payment core API key secret is empty.');
    }
    const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
    if (!parsed.apiKey) {
      throw new Error('Payment core API key secret missing apiKey.');
    }
    cachedCoreApiKey = parsed.apiKey;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(cachedCoreApiKey);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid core API key.');
  }
};

export const getOzowConfig = async () => {
  if (cachedOzowConfig) {
    return cachedOzowConfig;
  }

  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('OZOW_CONFIG_SECRET_ARN') })
  );
  if (!response.SecretString) {
    throw new Error('OZOW config secret is empty.');
  }

  cachedOzowConfig = JSON.parse(response.SecretString) as {
    siteCode?: string;
    privateKey?: string;
    apiKey?: string;
    callbackSecret?: string;
  };
  return cachedOzowConfig;
};

export const computeOzowHash = (values: string[], privateKey: string) =>
  createHash('sha512')
    .update(`${values.join('')}${privateKey}`.toLowerCase(), 'utf8')
    .digest('hex');
