import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, getOzowConfig, computeOzowHash, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) {
      return json(400, { message: 'paymentIntentId is required.' });
    }

    const paymentIntentResponse = await dynamo.send(
      new GetCommand({
        TableName: requireEnv('PAYMENT_INTENTS_TABLE_NAME'),
        Key: { paymentIntentId },
      })
    );
    const paymentIntent = paymentIntentResponse.Item as
      | {
          paymentIntentId: string;
          amount: number;
          currency?: string;
          checkoutReference?: string;
          bankReference?: string;
          metadata?: {
            customer?: { email?: string; phoneNumber?: string };
          };
        }
      | undefined;

    if (!paymentIntent) {
      return json(404, { message: 'Payment intent not found.' });
    }

    const returnState = event.queryStringParameters?.return;
    if (returnState) {
      const title =
        returnState === 'success'
          ? 'Payment submitted'
          : returnState === 'cancelled'
            ? 'Payment cancelled'
            : 'Payment error';
      const message =
        returnState === 'success'
          ? 'OZOW has redirected back. You can return to the Pashasha tab while we confirm the payment.'
          : returnState === 'cancelled'
            ? 'The payment was cancelled. You can return to the Pashasha tab and try again.'
            : 'OZOW reported an error. You can return to the Pashasha tab and retry the payment.';

      return {
        statusCode: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body><main style="font-family: sans-serif; max-width: 32rem; margin: 3rem auto; padding: 1rem;"><h1>${title}</h1><p>${message}</p><p>This window will try to close automatically.</p><script>(function(){var payload={type:'pashasha-payment-return',paymentIntentId:${JSON.stringify(paymentIntentId)},status:${JSON.stringify(returnState)}};function notifyOpener(){try{if(window.opener&&!window.opener.closed){window.opener.postMessage(payload,'*');}}catch(e){}}try{localStorage.setItem('pashasha-payment-return',JSON.stringify(payload));}catch(e){}notifyOpener();setTimeout(notifyOpener,300);setTimeout(notifyOpener,900);setTimeout(function(){window.close();},1500);}());</script></main></body></html>`,
      };
    }

    const ozowConfig = await getOzowConfig();
    const siteCode = ozowConfig.siteCode?.trim();
    const privateKey = ozowConfig.privateKey?.trim();
    if (!siteCode || !privateKey) {
      return {
        statusCode: 500,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OZOW configuration missing</title></head><body><main style="font-family: sans-serif; max-width: 32rem; margin: 3rem auto; padding: 1rem;"><h1>OZOW configuration missing</h1><p>The OZOW <code>siteCode</code> and <code>privateKey</code> must both be configured before checkout can continue.</p></main></body></html>',
      };
    }

    const apiBase = requireEnv('PAYMENT_PUBLIC_API_BASE_URL').replace(/\/$/, '');
    const currencyCode = paymentIntent.currency ?? 'ZAR';
    const amount = paymentIntent.amount.toFixed(2);
    const transactionReference = paymentIntent.checkoutReference ?? paymentIntent.paymentIntentId;
    const bankReference = paymentIntent.bankReference ?? paymentIntent.paymentIntentId;
    const customer =
      paymentIntent.metadata?.customer?.email?.trim() ||
      paymentIntent.metadata?.customer?.phoneNumber?.trim() ||
      '';
    const successUrl = `${apiBase}/checkout/${paymentIntentId}?return=success`;
    const cancelUrl = `${apiBase}/checkout/${paymentIntentId}?return=cancelled`;
    const errorUrl = `${apiBase}/checkout/${paymentIntentId}?return=error`;
    const notifyUrl = `${apiBase}/callbacks/ozow?paymentIntentId=${encodeURIComponent(paymentIntentId)}`;
    const isTest = requireEnv('OZOW_IS_TEST');
    const paymentUrl = requireEnv('OZOW_PAYMENT_URL');

    const fields: Array<[string, string]> = [
      ['SiteCode', siteCode],
      ['CountryCode', 'ZA'],
      ['CurrencyCode', currencyCode],
      ['Amount', amount],
      ['TransactionReference', transactionReference],
      ['BankReference', bankReference],
      ['Optional1', ''],
      ['Optional2', ''],
      ['Optional3', ''],
      ['Optional4', ''],
      ['Optional5', ''],
      ['Customer', customer],
    ];
    fields.push(
      ['CancelUrl', cancelUrl],
      ['ErrorUrl', errorUrl],
      ['SuccessUrl', successUrl],
      ['NotifyUrl', notifyUrl],
      ['IsTest', isTest]
    );

    const hashCheck = computeOzowHash(
      fields.map(([, value]) => value),
      privateKey
    );

    const hiddenInputs = [...fields, ['HashCheck', hashCheck]]
      .map(
        ([name, value]) =>
          `<input type="hidden" name="${name}" value="${String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}">`
      )
      .join('');

    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Redirecting to OZOW</title></head><body><main style="font-family: sans-serif; max-width: 36rem; margin: 3rem auto; padding: 1rem;"><h1>Redirecting to OZOW</h1><p>Your payment is being handed off to OZOW sandbox.</p><form id="ozow-form" method="post" action="${paymentUrl}">${hiddenInputs}<button type="submit" style="padding:0.9rem 1.4rem;border-radius:999px;border:none;background:#ff6a00;color:#fff;font-weight:700;cursor:pointer;">Continue to OZOW</button></form><script>document.getElementById('ozow-form')?.submit();</script></main></body></html>`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OZOW handoff failed</title></head><body><main style="font-family: sans-serif; max-width: 32rem; margin: 3rem auto; padding: 1rem;"><h1>OZOW handoff failed</h1><p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></main></body></html>`,
    };
  }
};
