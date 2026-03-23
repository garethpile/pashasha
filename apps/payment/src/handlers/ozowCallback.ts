import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { assertCoreApiKey, dynamo, json, requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});
let cachedCoreCallbackKey: string | undefined;

const getCoreCallbackKey = async () => {
  if (cachedCoreCallbackKey) return cachedCoreCallbackKey;
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('PAYMENT_TO_CORE_API_KEY_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
  if (!parsed.apiKey) throw new Error('Payment-to-core API key secret missing apiKey.');
  cachedCoreCallbackKey = parsed.apiKey;
  return cachedCoreCallbackKey;
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const contentType = event.headers['content-type'] ?? event.headers['Content-Type'] ?? '';
    const rawBody =
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : (event.body ?? '');

    let payload: Record<string, string> = {};
    if (rawBody) {
      if (contentType.includes('application/json')) {
        payload = JSON.parse(rawBody) as Record<string, string>;
      } else {
        payload = Object.fromEntries(new URLSearchParams(rawBody).entries());
      }
    }

    const paymentIntentId =
      event.queryStringParameters?.paymentIntentId ??
      payload.paymentIntentId ??
      payload.PaymentIntentId ??
      '';
    const statusSource =
      payload.status ??
      payload.Status ??
      payload.TransactionStatus ??
      payload.transactionStatus ??
      '';

    const normalizedStatus = (() => {
      const value = statusSource.trim().toLowerCase();
      if (['paid', 'successful', 'success', 'complete', 'completed'].includes(value)) return 'paid';
      if (['cancelled', 'canceled', 'cancel'].includes(value)) return 'cancelled';
      if (['failed', 'failure', 'error'].includes(value)) return 'failed';
      if (value === 'abandoned') return 'abandoned';
      if (['pending investigation', 'pending_investigation'].includes(value))
        return 'pending-investigation';
      if (value === 'pending') return 'pending';
      return value;
    })();

    if (!paymentIntentId || !normalizedStatus) {
      return json(400, { message: 'paymentIntentId and status are required.' });
    }

    const now = new Date().toISOString();
    await dynamo.send(
      new UpdateCommand({
        TableName: requireEnv('PAYMENT_INTENTS_TABLE_NAME'),
        Key: { paymentIntentId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': normalizedStatus,
          ':updatedAt': now,
        },
      })
    );

    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('PAYMENT_EVENTS_TABLE_NAME'),
        Item: {
          paymentIntentId,
          createdAt: now,
          eventType: 'payment.callback.received',
          status: normalizedStatus,
          payload,
        },
      })
    );

    if (normalizedStatus === 'paid') {
      const callbackKey = await getCoreCallbackKey();
      const response = await fetch(
        `${requireEnv('CORE_API_URL').replace(/\/$/, '')}/internal/payments/${paymentIntentId}/confirm`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-payment-callback-key': callbackKey,
          },
          body: JSON.stringify({
            paymentIntentId,
          }),
        }
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Core payment confirmation failed.');
      }
    } else {
      const callbackKey = await getCoreCallbackKey();
      const response = await fetch(
        `${requireEnv('CORE_API_URL').replace(/\/$/, '')}/internal/payments/${paymentIntentId}/status`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-payment-callback-key': callbackKey,
          },
          body: JSON.stringify({
            paymentIntentId,
            status: normalizedStatus,
            rawStatus: statusSource,
          }),
        }
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Core payment status sync failed.');
      }
    }

    return json(200, { ok: true, paymentIntentId, status: normalizedStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
