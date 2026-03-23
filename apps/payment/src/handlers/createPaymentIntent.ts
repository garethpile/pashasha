import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  assertCoreApiKey,
  dynamo,
  generateBankReference,
  generateCheckoutReference,
  generatePaymentIntentId,
  json,
  requireEnv,
} from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertCoreApiKey(event.headers['x-core-api-key'] ?? event.headers['X-Core-Api-Key']);

    const body = event.body
      ? (JSON.parse(event.body) as {
          paymentIntentId?: string;
          amount?: number;
          currency?: string;
          engine?: string;
          metadata?: Record<string, unknown>;
        })
      : {};

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return json(400, { message: 'amount is required.' });
    }

    if (body.engine !== 'ozow') {
      return json(400, { message: 'Only ozow is supported in MVP.' });
    }

    const paymentIntentId = body.paymentIntentId ?? generatePaymentIntentId();
    const checkoutReference = generateCheckoutReference();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const apiBase = requireEnv('PAYMENT_PUBLIC_API_BASE_URL').replace(/\/$/, '');

    const item = {
      paymentIntentId,
      transactionId:
        typeof body.metadata?.transactionId === 'string' ? body.metadata.transactionId : undefined,
      status: 'pending',
      paymentEngine: body.engine,
      amount: body.amount,
      currency: body.currency ?? 'ZAR',
      checkoutReference,
      bankReference: generateBankReference(paymentIntentId),
      redirectUrl: `${apiBase}/checkout/${paymentIntentId}`,
      expiresAt,
      metadata: body.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('PAYMENT_INTENTS_TABLE_NAME'),
        Item: item,
      })
    );

    return json(201, item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
