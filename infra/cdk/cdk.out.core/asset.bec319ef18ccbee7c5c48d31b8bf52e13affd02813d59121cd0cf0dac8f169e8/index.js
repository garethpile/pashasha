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

// ../../apps/core/src/handlers/createPaymentIntent.ts
var createPaymentIntent_exports = {};
__export(createPaymentIntent_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(createPaymentIntent_exports);
var import_lib_dynamodb2 = require('@aws-sdk/lib-dynamodb');

// ../../apps/core/src/lib/shared.ts
var import_client_dynamodb = require('@aws-sdk/client-dynamodb');
var import_lib_dynamodb = require('@aws-sdk/lib-dynamodb');
var import_client_secrets_manager = require('@aws-sdk/client-secrets-manager');
var import_client_cognito_identity_provider = require('@aws-sdk/client-cognito-identity-provider');
var import_crypto = require('crypto');
var dynamo = import_lib_dynamodb.DynamoDBDocumentClient.from(
  new import_client_dynamodb.DynamoDBClient({})
);
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var secrets = new import_client_secrets_manager.SecretsManagerClient({});
var cachedPaymentCoreApiKey;
var cachedVoucherCoreApiKey;
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
var getPaymentCoreApiKey = async () => {
  if (cachedPaymentCoreApiKey) {
    return cachedPaymentCoreApiKey;
  }
  const response = await secrets.send(
    new import_client_secrets_manager.GetSecretValueCommand({
      SecretId: requireEnv('PAYMENT_CORE_API_KEY_SECRET_ARN'),
    })
  );
  if (!response.SecretString) {
    throw new Error('Payment core API key secret is empty.');
  }
  const parsed = JSON.parse(response.SecretString);
  if (!parsed.apiKey) {
    throw new Error('Payment core API key secret missing apiKey.');
  }
  cachedPaymentCoreApiKey = parsed.apiKey;
  return cachedPaymentCoreApiKey;
};
var getVoucherCoreApiKey = async () => {
  if (cachedVoucherCoreApiKey) {
    return cachedVoucherCoreApiKey;
  }
  const response = await secrets.send(
    new import_client_secrets_manager.GetSecretValueCommand({
      SecretId: requireEnv('VOUCHER_CORE_API_KEY_SECRET_ARN'),
    })
  );
  if (!response.SecretString) {
    throw new Error('Voucher core API key secret is empty.');
  }
  const parsed = JSON.parse(response.SecretString);
  if (!parsed.apiKey) {
    throw new Error('Voucher core API key secret missing apiKey.');
  }
  cachedVoucherCoreApiKey = parsed.apiKey;
  return cachedVoucherCoreApiKey;
};
var getAvailableVoucherDenominations = async () => {
  const voucherApiKey = await getVoucherCoreApiKey();
  const response = await fetch(
    `${requireEnv('VOUCHER_API_URL').replace(/\/$/, '')}/internal/availability`,
    {
      method: 'GET',
      headers: {
        'x-core-api-key': voucherApiKey,
      },
    }
  );
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Voucher availability lookup failed.');
  }
  const payload = await response.json();
  return (payload.denominations ?? [])
    .filter((entry) => typeof entry.amount === 'number' && (entry.availableCount ?? 0) > 0)
    .map((entry) => entry.amount)
    .sort((a, b) => a - b);
};
var generateTransactionId = () => `txn_${(0, import_crypto.randomUUID)()}`;

// ../../apps/core/src/handlers/createPaymentIntent.ts
var OZOW_FEE_AMOUNT = 1.5;
var PLATFORM_FEE_AMOUNT = 1;
var handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    if (!body.civilServantId || typeof body.voucherDenomination !== 'number') {
      return json(400, { message: 'civilServantId and voucherDenomination are required.' });
    }
    if ((body.paymentEngine ?? 'ozow') !== 'ozow') {
      return json(400, { message: 'Only ozow is currently supported.' });
    }
    const recipient = await dynamo.send(
      new import_lib_dynamodb2.GetCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId: body.civilServantId },
      })
    );
    const civilServant = recipient.Item;
    if (!civilServant?.civilServantId) {
      return json(404, { message: 'Civil servant not found.' });
    }
    const allowedDenominations = await getAvailableVoucherDenominations();
    if (!allowedDenominations.includes(body.voucherDenomination)) {
      return json(400, { message: 'Voucher denomination is not available for this recipient.' });
    }
    const voucherAmount = body.voucherDenomination;
    const customerChargeAmount = Number(
      (voucherAmount + OZOW_FEE_AMOUNT + PLATFORM_FEE_AMOUNT).toFixed(2)
    );
    const transactionId = generateTransactionId();
    const paymentApiKey = await getPaymentCoreApiKey();
    const payerDisplayName =
      `${body.customer?.firstName?.trim() ?? ''} ${body.customer?.familyName?.trim() ?? ''}`.trim();
    const civilServantName =
      civilServant.displayName?.trim() ||
      `${civilServant.firstName ?? ''} ${civilServant.familyName ?? ''}`.trim() ||
      'Civil Servant';
    const paymentResponse = await fetch(
      `${requireEnv('PAYMENT_API_URL').replace(/\/$/, '')}/internal/payment-intents`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-core-api-key': paymentApiKey,
        },
        body: JSON.stringify({
          amount: customerChargeAmount,
          currency: 'ZAR',
          engine: 'ozow',
          metadata: {
            civilServantId: body.civilServantId,
            civilServantName,
            voucherDenomination: voucherAmount,
            voucherAmount,
            customerChargeAmount,
            paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
            platformFeeAmount: PLATFORM_FEE_AMOUNT,
            transactionId,
            customer: body.customer ?? {},
          },
        }),
      }
    );
    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.text();
      return json(502, {
        message: 'Payment engine call failed.',
        paymentResponse: errorBody,
      });
    }
    const paymentIntent = await paymentResponse.json();
    const now = /* @__PURE__ */ new Date().toISOString();
    await dynamo.send(
      new import_lib_dynamodb2.PutCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        Item: {
          transactionId,
          paymentIntentId: paymentIntent.paymentIntentId,
          status: 'pending-payment',
          amount: voucherAmount,
          voucherAmount,
          customerChargeAmount,
          paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
          platformFeeAmount: PLATFORM_FEE_AMOUNT,
          currency: paymentIntent.currency,
          paymentEngine: paymentIntent.paymentEngine,
          payoutMethod: 'voucher',
          civilServantId: body.civilServantId,
          civilServantName,
          customerId: body.customer?.customerId?.trim() || `guest:${transactionId}`,
          customerEmail: body.customer?.email?.trim() ?? '',
          customerPhoneNumber: body.customer?.phoneNumber?.trim() ?? '',
          customerName: payerDisplayName,
          payerDisplayName: payerDisplayName || 'Anonymous',
          voucherDenomination: voucherAmount,
          createdAt: now,
          updatedAt: now,
        },
      })
    );
    return json(201, {
      paymentIntentId: paymentIntent.paymentIntentId,
      status: paymentIntent.status,
      paymentEngine: paymentIntent.paymentEngine,
      amount: paymentIntent.amount,
      voucherAmount,
      customerChargeAmount,
      paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
      platformFeeAmount: PLATFORM_FEE_AMOUNT,
      currency: paymentIntent.currency,
      civilServantId: body.civilServantId,
      checkoutReference: paymentIntent.checkoutReference,
      redirectUrl: paymentIntent.redirectUrl,
      expiresAt: paymentIntent.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
