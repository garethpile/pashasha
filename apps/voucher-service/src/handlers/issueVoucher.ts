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
      baseUrl:
        secrets.baseUrl ??
        process.env.FLASH_BASE_URL ??
        'https://api-flashswitch-sandbox.flash-group.com',
      tokenUrl:
        secrets.tokenUrl ??
        process.env.FLASH_TOKEN_URL ??
        'https://api-flashswitch-sandbox.flash-group.com/token',
      apiKey: secrets.apiKey ?? process.env.FLASH_API_KEY,
      accountNumber: secrets.accountNumber ?? process.env.FLASH_ACCOUNT_NUMBER,
      useMock: secrets.useMock ?? process.env.FLASH_USE_MOCK === 'true',
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
