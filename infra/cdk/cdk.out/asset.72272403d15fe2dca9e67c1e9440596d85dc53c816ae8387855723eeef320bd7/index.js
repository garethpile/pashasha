var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// ../lambda/customer-payment/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(handler_exports);
var import_crypto = require('crypto');
var import_client_dynamodb = require('@aws-sdk/client-dynamodb');
var import_lib_dynamodb = require('@aws-sdk/lib-dynamodb');
var import_client_sns = require('@aws-sdk/client-sns');
var import_client_secrets_manager = require('@aws-sdk/client-secrets-manager');
var dynamo = import_lib_dynamodb.DynamoDBDocumentClient.from(
  new import_client_dynamodb.DynamoDBClient({})
);
var sns = new import_client_sns.SNSClient({});
var secrets = new import_client_secrets_manager.SecretsManagerClient({});
var PAYMENTS_TABLE_NAME = process.env.PAYMENTS_TABLE_NAME;
var SUCCESS_TOPIC_ARN = process.env.PAYMENT_SUCCESS_SNS_TOPIC_ARN;
var FAILURE_TOPIC_ARN = process.env.PAYMENT_FAILURE_SNS_TOPIC_ARN;
var ECLIPSE_SECRET_ARN = process.env.ECLIPSE_SECRET_ARN;
async function loadSecret() {
  const res = await secrets.send(
    new import_client_secrets_manager.GetSecretValueCommand({
      SecretId: ECLIPSE_SECRET_ARN,
    })
  );
  const raw = res.SecretString ?? '{}';
  return JSON.parse(raw);
}
async function getAccessToken(cfg) {
  const apiBase = cfg.ECLIPSE_API_BASE.replace(/\/$/, '');
  if (cfg.ECLIPSE_CLIENT_ID && cfg.ECLIPSE_CLIENT_SECRET) {
    const url2 = `${apiBase}/oauth/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.ECLIPSE_CLIENT_ID,
      client_secret: cfg.ECLIPSE_CLIENT_SECRET,
    });
    const resp2 = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp2.ok) {
      throw new Error(`Eclipse token request failed: ${resp2.status} ${await resp2.text()}`);
    }
    const data2 = await resp2.json();
    return data2.access_token;
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
  const data = await resp.json();
  const bearer = data?.headerValue ?? '';
  const token = bearer.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new Error('Missing token from Eclipse login');
  }
  return token;
}
async function publishMessage(subject, message, topicArn) {
  if (!topicArn) return;
  await sns.send(
    new import_client_sns.PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: message,
    })
  );
}
var handler = async (event) => {
  const cfg = await loadSecret();
  const amount = Number(event.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }
  const currency = (event.currency ?? 'ZAR').toUpperCase();
  const paymentId = event.externalUniqueId ?? (0, import_crypto.randomUUID)();
  const now = /* @__PURE__ */ new Date().toISOString();
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
    new import_lib_dynamodb.PutCommand({
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
        customerId: event.customerId ? Number(event.customerId) : void 0,
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
    let data = {};
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = {};
    }
    await dynamo.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: PAYMENTS_TABLE_NAME,
        Key: { paymentId },
        UpdateExpression: 'SET #s = :s, updatedAt = :u, raw = :r, authorizationUrl = :a',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': data.status ?? 'PENDING',
          ':u': /* @__PURE__ */ new Date().toISOString(),
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
  } catch (err) {
    await dynamo.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: PAYMENTS_TABLE_NAME,
        Key: { paymentId },
        UpdateExpression: 'SET #s = :s, updatedAt = :u, error = :e',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'FAILED',
          ':u': /* @__PURE__ */ new Date().toISOString(),
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
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
