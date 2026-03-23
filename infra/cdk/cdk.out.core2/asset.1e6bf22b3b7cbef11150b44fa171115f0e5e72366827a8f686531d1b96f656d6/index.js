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

// ../../apps/core/src/handlers/getPaymentIntent.ts
var getPaymentIntent_exports = {};
__export(getPaymentIntent_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(getPaymentIntent_exports);
var import_lib_dynamodb2 = require('@aws-sdk/lib-dynamodb');

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
var cachedPaymentCoreApiKey;
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

// ../../apps/core/src/handlers/getPaymentIntent.ts
var handler = async (event) => {
  try {
    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) {
      return json(400, { message: 'paymentIntentId is required.' });
    }
    const paymentApiKey = await getPaymentCoreApiKey();
    const paymentResponse = await fetch(
      `${requireEnv('PAYMENT_API_URL').replace(/\/$/, '')}/internal/payment-intents/${paymentIntentId}`,
      {
        headers: {
          'x-core-api-key': paymentApiKey,
        },
      }
    );
    if (paymentResponse.status === 404) {
      return json(404, { message: 'Payment intent not found.' });
    }
    if (!paymentResponse.ok) {
      return json(502, { message: 'Payment engine lookup failed.' });
    }
    const paymentIntent = await paymentResponse.json();
    const transactions = await dynamo.send(
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
    const transaction = transactions.Items?.[0];
    return json(200, {
      paymentIntentId,
      status: paymentIntent.status,
      amount: transaction?.customerChargeAmount ?? paymentIntent.amount ?? void 0,
      voucherAmount: transaction?.voucherAmount ?? transaction?.voucherDenomination ?? void 0,
      customerChargeAmount: transaction?.customerChargeAmount ?? void 0,
      paymentProviderFeeAmount: transaction?.paymentProviderFeeAmount ?? void 0,
      platformFeeAmount: transaction?.platformFeeAmount ?? void 0,
      transactionId: transaction?.transactionId ?? null,
      voucherAllocation: {
        status: transaction?.status === 'completed' ? 'allocated' : 'pending',
        deliveryStatus:
          transaction?.deliveryStatus ?? (transaction?.status === 'completed' ? 'sent' : 'pending'),
      },
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
