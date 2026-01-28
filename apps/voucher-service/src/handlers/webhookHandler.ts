import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { json } from '../lib/response.js';
import { createStore } from '../lib/store-factory.js';
import { verifyFlashSignature } from '../lib/flash-webhook.js';
import { loadFlashSecrets } from '../lib/secrets.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return json(400, { error: 'missing body' });
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const signatureHeaderName = process.env.FLASH_WEBHOOK_SIGNATURE_HEADER ?? 'x-flash-signature';
  const signatureHeader =
    event.headers?.[signatureHeaderName] ?? event.headers?.[signatureHeaderName.toLowerCase()];

  const secrets = await loadFlashSecrets();
  const secret = secrets.webhookSecret ?? process.env.FLASH_WEBHOOK_SECRET ?? '';
  if (!secret) {
    return json(500, { error: 'missing webhook secret' });
  }

  const valid = verifyFlashSignature({
    body,
    secret,
    signatureHeader: signatureHeader ?? null,
  });
  if (!valid) {
    return json(401, { error: 'invalid signature' });
  }

  const payload = JSON.parse(body) as {
    payoutId?: string;
    status?: 'redeemed' | 'expired' | 'issued';
  };

  if (!payload.payoutId || !payload.status) {
    return json(400, { error: 'invalid payload' });
  }

  const store = createStore();
  await store.updatePayoutStatus(payload.payoutId, payload.status);
  await store.recordEvent(payload.payoutId, 'flash_webhook', payload);

  return json(200, { ok: true });
};
