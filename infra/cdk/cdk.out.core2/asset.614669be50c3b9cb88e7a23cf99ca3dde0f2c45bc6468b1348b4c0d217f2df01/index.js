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

// ../../apps/core/src/handlers/createCivilServant.ts
var createCivilServant_exports = {};
__export(createCivilServant_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(createCivilServant_exports);
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
var cachedAdminApiKey;
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
var assertSecretKey = async (provided, cacheKey, secretArnEnv, missingMessage, invalidMessage) => {
  if (!provided) {
    throw new Error(missingMessage);
  }
  let expected = cacheKey === 'admin' ? cachedAdminApiKey : cachedPaymentCoreApiKey;
  if (!expected) {
    const response = await secrets.send(
      new import_client_secrets_manager.GetSecretValueCommand({
        SecretId: requireEnv(secretArnEnv),
      })
    );
    if (!response.SecretString) {
      throw new Error(`Secret ${secretArnEnv} is empty.`);
    }
    const parsed = JSON.parse(response.SecretString);
    if (!parsed.apiKey) {
      throw new Error(`Secret ${secretArnEnv} missing apiKey.`);
    }
    expected = parsed.apiKey;
    if (cacheKey === 'admin') cachedAdminApiKey = expected;
    else cachedPaymentCoreApiKey = expected;
  }
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !(0, import_crypto.timingSafeEqual)(providedBuffer, expectedBuffer)
  ) {
    throw new Error(invalidMessage);
  }
};
var assertAdminApiKey = async (provided) =>
  assertSecretKey(
    provided,
    'admin',
    'CORE_ADMIN_API_KEY_SECRET_ARN',
    'Missing admin API key.',
    'Invalid admin API key.'
  );
var reserveNextAccountNumber = async (prefix, year) => {
  const response = await dynamo.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: requireEnv('ACCOUNT_SEQUENCES_TABLE_NAME'),
      Key: { sequenceKey: `${prefix}#${year}` },
      UpdateExpression: 'ADD nextValue :inc SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': /* @__PURE__ */ new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
    })
  );
  const nextValue = Number(response.Attributes?.nextValue ?? 0);
  return `${prefix}-${year}-${String(nextValue).padStart(8, '0')}`;
};

// ../../apps/core/src/handlers/createCivilServant.ts
var DEFAULT_DENOMINATIONS = [50, 100, 150];
var handler = async (event) => {
  try {
    await assertAdminApiKey(event.headers['x-admin-api-key'] ?? event.headers['X-Admin-Api-Key']);
    const body = event.body ? JSON.parse(event.body) : {};
    if (!body.civilServantId || !body.firstName || !body.familyName) {
      return json(400, { message: 'civilServantId, firstName and familyName are required.' });
    }
    const now = /* @__PURE__ */ new Date().toISOString();
    const accountNumber = await reserveNextAccountNumber('CS', new Date(now).getUTCFullYear());
    const item = {
      profileId: body.civilServantId,
      accountNumber,
      entityType: 'civil-servant',
      civilServantId: body.civilServantId,
      displayName: `${body.firstName} ${body.familyName}`.trim(),
      firstName: body.firstName,
      familyName: body.familyName,
      department: body.department ?? '',
      station: body.station ?? '',
      phoneNumber: body.phoneNumber ?? '',
      qrToken: body.qrToken ?? `qr_${body.civilServantId}`,
      availableVoucherDenominations: body.availableVoucherDenominations?.length
        ? body.availableVoucherDenominations
        : DEFAULT_DENOMINATIONS,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await dynamo.send(
      new import_lib_dynamodb2.PutCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Item: item,
      })
    );
    return json(201, item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing admin API key.' || message === 'Invalid admin API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
