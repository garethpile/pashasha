import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});
const cache = new Map<string, string>();

export type FlashSecrets = {
  apiKey?: string;
  apiSecret?: string;
  apiToken?: string;
  authScheme?: 'basic' | 'bearer' | 'headers';
  apiKeyHeader?: string;
  apiSecretHeader?: string;
  webhookSecret?: string;
};

async function getSecretString(arn: string): Promise<string> {
  if (cache.has(arn)) return cache.get(arn) as string;
  const result = await client.send(new GetSecretValueCommand({ SecretId: arn }));
  const secret = result.SecretString ?? '';
  cache.set(arn, secret);
  return secret;
}

export async function loadFlashSecrets(): Promise<FlashSecrets> {
  const arn = process.env.FLASH_SECRETS_ARN;
  if (!arn) return {};

  const secret = await getSecretString(arn);
  try {
    const parsed = JSON.parse(secret) as FlashSecrets;
    return parsed;
  } catch {
    return {
      apiToken: secret,
    };
  }
}
