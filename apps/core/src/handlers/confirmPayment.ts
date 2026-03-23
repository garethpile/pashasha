import { timingSafeEqual } from 'crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { json, requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});
const sfn = new SFNClient({});
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

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertPaymentCallbackKey(
      event.headers['x-payment-callback-key'] ?? event.headers['X-Payment-Callback-Key']
    );

    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) {
      return json(400, { message: 'paymentIntentId is required.' });
    }

    const execution = await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: requireEnv('PAYMENT_COMPLETION_STATE_MACHINE_ARN'),
        input: JSON.stringify({
          paymentIntentId,
          trigger: 'payment-callback',
          requestedAt: new Date().toISOString(),
        }),
      })
    );

    return json(202, {
      paymentIntentId,
      status: 'accepted',
      executionArn: execution.executionArn,
      startDate: execution.startDate?.toISOString?.() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
