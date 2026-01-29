import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});
const cache = new Map<string, string>();

export type FlashSecrets = {
  apiKey?: string;
  accountNumber?: string;
  tokenUrl?: string;
  baseUrl?: string;
  cashOutProductCode?: number;
  flashTokenProductCode?: number;
  useMock?: boolean;
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
      apiKey: secret,
    };
  }
}
