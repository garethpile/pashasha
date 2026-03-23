import { timingSafeEqual } from 'crypto';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, json, requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});
let cachedPaymentCallbackKey: string | undefined;

const getPaymentCallbackKey = async () => {
  if (cachedPaymentCallbackKey) return cachedPaymentCallbackKey;
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('PAYMENT_TO_CORE_API_KEY_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
  if (!parsed.apiKey) throw new Error('Secret PAYMENT_TO_CORE_API_KEY_SECRET_ARN missing apiKey.');
  cachedPaymentCallbackKey = parsed.apiKey;
  return cachedPaymentCallbackKey;
};

const assertPaymentCallbackKey = async (provided?: string) => {
  if (!provided) throw new Error('Missing payment callback key.');
  const expected = await getPaymentCallbackKey();
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid payment callback key.');
  }
};

const normalizeTransactionStatus = (status: string) => {
  const value = status.trim().toLowerCase();
  if (value === 'cancelled') return 'cancelled';
  if (value === 'failed') return 'failed';
  if (value === 'abandoned') return 'abandoned';
  if (value === 'pending-investigation') return 'pending-investigation';
  if (value === 'pending') return 'pending';
  return value;
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertPaymentCallbackKey(
      event.headers['x-payment-callback-key'] ?? event.headers['X-Payment-Callback-Key']
    );

    const paymentIntentId = event.pathParameters?.paymentIntentId;
    const body = event.body
      ? (JSON.parse(event.body) as { status?: string; rawStatus?: string })
      : {};
    if (!paymentIntentId || !body.status) {
      return json(400, { message: 'paymentIntentId and status are required.' });
    }

    const query = await dynamo.send(
      new QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byPaymentIntent',
        KeyConditionExpression: 'paymentIntentId = :paymentIntentId',
        ExpressionAttributeValues: {
          ':paymentIntentId': paymentIntentId,
        },
        Limit: 1,
      })
    );

    const transaction = query.Items?.[0] as { transactionId?: string; status?: string } | undefined;
    if (!transaction?.transactionId) {
      return json(404, { message: 'Transaction not found for payment intent.' });
    }

    const nextStatus = normalizeTransactionStatus(body.status);
    const currentStatus = String(transaction.status ?? '').toLowerCase();
    if (currentStatus === 'completed') {
      return json(200, {
        transactionId: transaction.transactionId,
        status: currentStatus,
        skipped: 'already-completed',
      });
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        Key: { transactionId: transaction.transactionId },
        UpdateExpression:
          'SET #status = :status, updatedAt = :updatedAt, paymentOutcomeStatus = :paymentOutcomeStatus, completionWorkflowStatus = :workflowStatus REMOVE completionError',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': nextStatus,
          ':updatedAt': new Date().toISOString(),
          ':paymentOutcomeStatus': body.rawStatus ?? body.status,
          ':workflowStatus': 'not-required',
        },
      })
    );

    return json(200, {
      transactionId: transaction.transactionId,
      status: nextStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
