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

// ../../apps/core/src/handlers/lookupCivilServant.ts
var lookupCivilServant_exports = {};
__export(lookupCivilServant_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(lookupCivilServant_exports);
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

// ../../apps/core/src/handlers/lookupCivilServant.ts
var handler = async (event) => {
  try {
    const qrToken = event.queryStringParameters?.qrToken;
    const publicId = event.queryStringParameters?.publicId;
    if (!qrToken && !publicId) {
      return json(400, { message: 'qrToken or publicId is required.' });
    }
    let item;
    if (qrToken) {
      const response = await dynamo.send(
        new import_lib_dynamodb2.QueryCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          IndexName: 'byQrToken',
          KeyConditionExpression: 'qrToken = :qrToken',
          ExpressionAttributeValues: {
            ':qrToken': qrToken,
          },
          Limit: 1,
        })
      );
      item = response.Items?.[0];
    } else if (publicId) {
      const response = await dynamo.send(
        new import_lib_dynamodb2.GetCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          Key: { profileId: publicId },
        })
      );
      item = response.Item;
    }
    if (!item || item.entityType !== 'civil-servant') {
      return json(404, { message: 'Civil servant not found.' });
    }
    const liveDenominations = await getAvailableVoucherDenominations();
    return json(200, {
      recipient: {
        civilServantId: item.civilServantId,
        displayName: item.displayName,
        occupation: item.occupation,
        primarySite: item.primarySite,
        department: item.department,
        station: item.station,
        qrToken: item.qrToken,
        availableVoucherDenominations: liveDenominations,
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
