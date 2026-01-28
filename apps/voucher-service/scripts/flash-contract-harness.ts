import assert from 'node:assert';
import crypto from 'node:crypto';
import { FlashClient } from '../src/lib/flash-client.js';
import { verifyFlashSignature } from '../src/lib/flash-webhook.js';
import type { PayoutIntent } from '../src/lib/types.js';

async function run() {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith('/vouchers')) {
      return new Response(
        JSON.stringify({
          reference: 'flash-ref-1',
          voucherCode: 'V-123',
          expiresAt: '2030-01-01T00:00:00.000Z',
          receiptUrl: 'https://example.com/receipt',
        }),
        { status: 200 }
      );
    }
    if (url.endsWith('/vouchers/flash-ref-1')) {
      return new Response(
        JSON.stringify({
          status: 'issued',
          voucherCode: 'V-123',
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ message: 'not found' }), {
      status: 404,
    });
  }) as typeof fetch;

  const client = new FlashClient({
    baseUrl: 'https://flash.example',
    apiKey: 'key',
    apiSecret: 'secret',
  });

  const intent: PayoutIntent = {
    id: 'payout_1',
    recipientId: 'recipient_1',
    amount: 1000,
    currency: 'ZAR',
    provider: 'flash',
    reference: 'ref_1',
    status: 'created',
    createdAt: new Date().toISOString(),
  };

  const result = await client.issueVoucher(intent);
  assert.strictEqual(result.status, 'issued');
  assert.strictEqual(result.voucherCode, 'V-123');
  assert.strictEqual(result.providerRef, 'flash-ref-1');

  const status = await client.getVoucherStatus('flash-ref-1');
  assert.strictEqual(status.status, 'issued');

  assert.ok(calls.length >= 2);

  const body = JSON.stringify({ payoutId: 'payout_1', status: 'issued' });
  const secret = 'webhook-secret';
  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

  assert.ok(verifyFlashSignature({ body, secret, signatureHeader: expected }));
  assert.ok(verifyFlashSignature({ body, secret, signatureHeader: `sha256=${expected}` }));

  console.log('flash-contract-harness: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
