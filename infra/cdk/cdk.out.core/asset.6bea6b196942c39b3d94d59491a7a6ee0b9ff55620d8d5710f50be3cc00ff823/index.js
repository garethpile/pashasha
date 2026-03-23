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

// ../../apps/core/src/handlers/confirmPayment.ts
var confirmPayment_exports = {};
__export(confirmPayment_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(confirmPayment_exports);
var import_lib_dynamodb2 = require('@aws-sdk/lib-dynamodb');
var import_client_secrets_manager2 = require('@aws-sdk/client-secrets-manager');

// ../../apps/core/src/lib/shared.ts
var import_client_dynamodb = require('@aws-sdk/client-dynamodb');
var import_lib_dynamodb = require('@aws-sdk/lib-dynamodb');
var import_client_secrets_manager = require('@aws-sdk/client-secrets-manager');
var import_client_cognito_identity_provider = require('@aws-sdk/client-cognito-identity-provider');
var dynamo = import_lib_dynamodb.DynamoDBDocumentClient.from(
  new import_client_dynamodb.DynamoDBClient({})
);
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var secrets = new import_client_secrets_manager.SecretsManagerClient({});
var requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
var json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

// ../../apps/core/src/handlers/confirmPayment.ts
var import_crypto = require('crypto');
var secrets2 = new import_client_secrets_manager2.SecretsManagerClient({});
var cachedPaymentCallbackKey;
var cachedVoucherCoreKey;
var cachedNotificationsCoreKey;
var getApiKey = async (envName, cache) => {
  if (cache === 'payment' && cachedPaymentCallbackKey) return cachedPaymentCallbackKey;
  if (cache === 'voucher' && cachedVoucherCoreKey) return cachedVoucherCoreKey;
  if (cache === 'notifications' && cachedNotificationsCoreKey) return cachedNotificationsCoreKey;
  const response = await secrets2.send(
    new import_client_secrets_manager2.GetSecretValueCommand({ SecretId: requireEnv(envName) })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}');
  if (!parsed.apiKey) throw new Error(`Secret ${envName} missing apiKey.`);
  if (cache === 'payment') cachedPaymentCallbackKey = parsed.apiKey;
  if (cache === 'voucher') cachedVoucherCoreKey = parsed.apiKey;
  if (cache === 'notifications') cachedNotificationsCoreKey = parsed.apiKey;
  return parsed.apiKey;
};
var formatCurrency = (amount) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
var assertPaymentCallbackKey = async (provided) => {
  if (!provided) throw new Error('Missing payment callback key.');
  const expected = await getApiKey('PAYMENT_TO_CORE_API_KEY_SECRET_ARN', 'payment');
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !(0, import_crypto.timingSafeEqual)(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid payment callback key.');
  }
};
var handler = async (event) => {
  try {
    await assertPaymentCallbackKey(
      event.headers['x-payment-callback-key'] ?? event.headers['X-Payment-Callback-Key']
    );
    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) return json(400, { message: 'paymentIntentId is required.' });
    const query = await dynamo.send(
      new import_lib_dynamodb2.QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byPaymentIntent',
        KeyConditionExpression: 'paymentIntentId = :paymentIntentId',
        ExpressionAttributeValues: {
          ':paymentIntentId': paymentIntentId,
        },
        Limit: 1,
      })
    );
    const transaction = query.Items?.[0];
    if (!transaction) return json(404, { message: 'Transaction not found.' });
    if ((transaction.status ?? '').toLowerCase() === 'completed') {
      return json(200, {
        transactionId: transaction.transactionId,
        status: 'completed',
        message: 'Transaction already completed.',
      });
    }
    const profile = await dynamo.send(
      new import_lib_dynamodb2.GetCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId: transaction.civilServantId },
      })
    );
    const civilServant = profile.Item;
    const voucherKey = await getApiKey('VOUCHER_CORE_API_KEY_SECRET_ARN', 'voucher');
    const voucherResponse = await fetch(
      `${requireEnv('VOUCHER_API_URL').replace(/\/$/, '')}/internal/allocations`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-core-api-key': voucherKey,
        },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          civilServantId: transaction.civilServantId,
          denomination: transaction.voucherDenomination,
        }),
      }
    );
    if (!voucherResponse.ok) {
      return json(502, { message: 'Voucher allocation failed.' });
    }
    const voucherAllocation = await voucherResponse.json();
    const civilServantName =
      transaction.civilServantName?.trim() ||
      civilServant?.displayName?.trim() ||
      `${civilServant?.firstName ?? ''} ${civilServant?.familyName ?? ''}`.trim() ||
      'Civil Servant';
    const payerDisplayName =
      transaction.customerName?.trim() || transaction.payerDisplayName?.trim() || 'Anonymous';
    const amountLabel = formatCurrency(transaction.voucherDenomination);
    const supplierName = voucherAllocation.supplier?.trim() || 'Shoprite Checkers';
    const reference = transaction.paymentIntentId ?? transaction.transactionId;
    let deliveryStatus = 'pending';
    let customerNotificationStatus = 'not-requested';
    if (civilServant?.phoneNumber) {
      const notificationsKey = await getApiKey(
        'NOTIFICATIONS_CORE_API_KEY_SECRET_ARN',
        'notifications'
      );
      const recipientNotification = await fetch(
        `${requireEnv('NOTIFICATIONS_API_URL').replace(/\/$/, '')}/internal/notifications/send`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-core-api-key': notificationsKey,
          },
          body: JSON.stringify({
            notificationType: 'voucher-issued',
            recipient: {
              phoneNumber: civilServant.phoneNumber,
            },
            templateData: {
              civilServantName,
              payerDisplayName,
              amountLabel,
              voucherCode: voucherAllocation.voucherCode,
              supplierName,
              barcodeLast4: voucherAllocation.barcodeLast4,
              voucherAllocationId: voucherAllocation.voucherAllocationId,
              reference,
            },
          }),
        }
      );
      deliveryStatus = recipientNotification.ok ? 'sent' : 'failed';
    } else {
      deliveryStatus = 'no-recipient-phone';
    }
    if (!transaction.customerId?.startsWith('guest:') && transaction.customerPhoneNumber?.trim()) {
      const notificationsKey = await getApiKey(
        'NOTIFICATIONS_CORE_API_KEY_SECRET_ARN',
        'notifications'
      );
      const customerNotification = await fetch(
        `${requireEnv('NOTIFICATIONS_API_URL').replace(/\/$/, '')}/internal/notifications/send`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-core-api-key': notificationsKey,
          },
          body: JSON.stringify({
            notificationType: 'customer-voucher-sent',
            recipient: {
              phoneNumber: transaction.customerPhoneNumber,
            },
            templateData: {
              civilServantName,
              amountLabel,
              supplierName,
              reference,
            },
          }),
        }
      );
      customerNotificationStatus = customerNotification.ok ? 'sent' : 'failed';
    }
    const now = /* @__PURE__ */ new Date().toISOString();
    await dynamo.send(
      new import_lib_dynamodb2.UpdateCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        Key: { transactionId: transaction.transactionId },
        UpdateExpression:
          'SET #status = :status, updatedAt = :updatedAt, completedAt = :completedAt, voucherAllocationId = :voucherAllocationId, supplierName = :supplierName, voucherBarcodeLast4 = :voucherBarcodeLast4, deliveryStatus = :deliveryStatus, customerNotificationStatus = :customerNotificationStatus, payerDisplayName = :payerDisplayName',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':updatedAt': now,
          ':completedAt': now,
          ':voucherAllocationId': voucherAllocation.voucherAllocationId,
          ':supplierName': supplierName,
          ':voucherBarcodeLast4': voucherAllocation.barcodeLast4 ?? '',
          ':deliveryStatus': deliveryStatus,
          ':customerNotificationStatus': customerNotificationStatus,
          ':payerDisplayName': payerDisplayName,
        },
      })
    );
    return json(200, {
      transactionId: transaction.transactionId,
      status: 'completed',
      voucherAllocationId: voucherAllocation.voucherAllocationId,
      deliveryStatus,
      customerNotificationStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing payment callback key.' || message === 'Invalid payment callback key.'
        ? 401
        : 400;
    return json(statusCode, { message });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
