import type { Handler } from 'aws-lambda';
import { FlashClient } from '../lib/flash-client.js';
import { FlashPayoutProvider } from '../lib/flash-provider.js';
import { createStore } from '../lib/store-factory.js';
import type { PayoutIntent } from '../lib/types.js';
import { loadFlashSecrets } from '../lib/secrets.js';

let clientPromise: Promise<FlashClient> | null = null;

async function getClient(): Promise<FlashClient> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const secrets = await loadFlashSecrets();
    return new FlashClient({
      baseUrl: process.env.FLASH_API_BASE_URL ?? 'https://api.flash.example',
      apiKey: secrets.apiKey ?? process.env.FLASH_API_KEY,
      apiSecret: secrets.apiSecret ?? process.env.FLASH_API_SECRET,
      apiToken: secrets.apiToken ?? process.env.FLASH_API_TOKEN,
      apiKeyHeader: secrets.apiKeyHeader ?? process.env.FLASH_API_KEY_HEADER,
      apiSecretHeader: secrets.apiSecretHeader ?? process.env.FLASH_API_SECRET_HEADER,
      authScheme:
        secrets.authScheme ??
        (process.env.FLASH_API_AUTH_SCHEME as 'basic' | 'bearer' | 'headers' | undefined) ??
        'headers',
    });
  })();
  return clientPromise;
}

export const handler: Handler = async (event) => {
  const store = createStore();

  let intent: PayoutIntent | null = null;
  if (typeof event?.payoutId === 'string') {
    intent = await store.getPayout(event.payoutId);
  } else {
    intent = event as PayoutIntent;
  }

  if (!intent) {
    throw new Error('payout intent not found');
  }

  const provider = new FlashPayoutProvider(await getClient());
  const result = await provider.payout(intent);
  if (result.status === 'issued') {
    await store.updatePayoutStatus(intent.id, 'issued', result);
  } else {
    await store.updatePayoutStatus(intent.id, 'failed', result);
  }

  return result;
};
