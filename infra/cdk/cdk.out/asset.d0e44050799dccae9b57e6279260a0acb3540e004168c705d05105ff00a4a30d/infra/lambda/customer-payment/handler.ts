import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});
const secrets = new SecretsManagerClient({});

const PAYMENTS_TABLE_NAME = process.env.PAYMENTS_TABLE_NAME!;
const SUCCESS_TOPIC_ARN = process.env.PAYMENT_SUCCESS_SNS_TOPIC_ARN;
const FAILURE_TOPIC_ARN = process.env.PAYMENT_FAILURE_SNS_TOPIC_ARN;
const ECLIPSE_SECRET_ARN = process.env.ECLIPSE_SECRET_ARN!;

type PaymentInput = {
  amount: number;
  currency?: string;
  destinationWalletId: string | number;
  customerId?: string;
  civilServantId?: string;
  guardToken?: string;
  accountNumber?: string;
  yourReference?: string;
  theirReference?: string;
  externalUniqueId?: string;
};

type EclipseSecret = {
  ECLIPSE_API_BASE: string;
  ECLIPSE_TENANT_ID: string;
  ECLIPSE_CLIENT_ID?: string;
  ECLIPSE_CLIENT_SECRET?: string;
  ECLIPSE_TENANT_IDENTITY?: string;
  ECLIPSE_TENANT_PASSWORD?: string;
};

async function loadSecret(): Promise<EclipseSecret> {
  const res = await secrets.send(
    new GetSecretValueCommand({
      SecretId: ECLIPSE_SECRET_ARN,
    })
  );
  const raw = res.SecretString ?? '{}';
  return JSON.parse(raw) as EclipseSecret;
}

async function getAccessToken(cfg: EclipseSecret): Promise<string> {
  const apiBase = cfg.ECLIPSE_API_BASE.replace(/\/$/, '');
  if (cfg.ECLIPSE_CLIENT_ID && cfg.ECLIPSE_CLIENT_SECRET) {
    const url = `${apiBase}/oauth/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.ECLIPSE_CLIENT_ID,
      client_secret: cfg.ECLIPSE_CLIENT_SECRET,
    });
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) {
      throw new Error(`Eclipse token request failed: ${resp.status} ${await resp.text()}`);
    }
    const data = (await resp.json()) as any;
    return data.access_token as string;
  }

  const url = `${apiBase}/authentication/login`;
  const payload = {
    identity: cfg.ECLIPSE_TENANT_IDENTITY,
    password: cfg.ECLIPSE_TENANT_PASSWORD,
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error(`Eclipse login failed: ${resp.status} ${await resp.text()}`);
  }
  const data = (await resp.json()) as any;
  const bearer = (data?.headerValue as string) ?? '';
  const token = bearer.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new Error('Missing token from Eclipse login');
  }
  return token;
}

async function publishMessage(subject: string, message: string, topicArn?: string) {
  if (!topicArn) return;
  await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: message,
    })
  );
}

export const handler = async (event: PaymentInput) => {
  const cfg = await loadSecret();
  const amount = Number(event.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }
  const currency = (event.currency ?? 'ZAR').toUpperCase();
  const paymentId = event.externalUniqueId ?? randomUUID();
  const now = new Date().toISOString();

  const record = {
    paymentId,
    externalId: paymentId,
    status: 'PENDING',
    amount,
    currency,
    walletId: `${event.destinationWalletId}`,
    customerId: event.customerId,
    civilServantId: event.civilServantId,
    guardToken: event.guardToken,
    accountNumber: event.accountNumber,
    paymentType: 'LINK',
    source: 'workflow',
    createdAt: now,
    updatedAt: now,
    metadata: {
      yourReference: event.yourReference ?? null,
      theirReference: event.theirReference ?? null,
    },
  };

  await dynamo.send(
    new PutCommand({
      TableName: PAYMENTS_TABLE_NAME,
      Item: record,
    })
  );

  try {
    const token = await getAccessToken(cfg);
    const apiBase = cfg.ECLIPSE_API_BASE.replace(/\/$/, '');
    const url = `${apiBase}/tenants/${cfg.ECLIPSE_TENANT_ID}/payments`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'GLOBAL_PAYMENT_LINK',
        amount,
        currency,
        destinationWalletId: Number(event.destinationWalletId),
        customerId: event.customerId ? Number(event.customerId) : undefined,
        externalUniqueId: paymentId,
        metadata: {
          guardToken: event.guardToken,
          guardId: event.civilServantId,
          accountNumber: event.accountNumber,
          yourReference: event.yourReference,
          theirReference: event.theirReference,
        },
      }),
    });
    const bodyText = await resp.text();
    if (!resp.ok) {
      throw new Error(`Eclipse createPayment failed: ${resp.status} ${bodyText}`);
    }
    let data: any = {};
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = {};
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE_NAME,
        Key: { paymentId },
        UpdateExpression: 'SET #s = :s, updatedAt = :u, raw = :r, authorizationUrl = :a',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': data.status ?? 'PENDING',
          ':u': new Date().toISOString(),
          ':r': data,
          ':a': data.completionUrl ?? data.redirectUrl ?? null,
        },
      })
    );

    await publishMessage(
      'Customer payment succeeded',
      JSON.stringify({ paymentId, data }, null, 2),
      SUCCESS_TOPIC_ARN
    );

    return {
      paymentId,
      authorizationUrl: data.completionUrl ?? data.redirectUrl,
      status: data.status ?? 'PENDING',
    };
  } catch (err: any) {
    await dynamo.send(
      new UpdateCommand({
        TableName: PAYMENTS_TABLE_NAME,
        Key: { paymentId },
        UpdateExpression: 'SET #s = :s, updatedAt = :u, error = :e',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'FAILED',
          ':u': new Date().toISOString(),
          ':e': err?.message ?? 'Unknown error',
        },
      })
    );
    await publishMessage(
      'Customer payment failed',
      JSON.stringify({ paymentId, error: err?.message }, null, 2),
      FAILURE_TOPIC_ARN ?? SUCCESS_TOPIC_ARN
    );
    throw err;
  }
};
