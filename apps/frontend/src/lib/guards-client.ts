import { GuardsClient } from '@pashashapay/contracts';
import { resolveApiRoot } from './api/config';

// Default to the resolved API root so production falls back to CloudFront when
// env vars are missing (e.g. QR scans on Amplify builds).
const defaultBaseUrl = `${resolveApiRoot()}/guards`;

// Bind fetch to the global object to avoid illegal invocation errors in browsers.
const boundFetch: typeof globalThis.fetch =
  typeof fetch === 'function' ? fetch.bind(globalThis) : (undefined as any);

export const guardsClient = new GuardsClient({
  baseUrl: defaultBaseUrl,
  fetchFn: boundFetch,
});
