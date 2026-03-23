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

// ../../apps/core/src/handlers/searchCivilServants.ts
var searchCivilServants_exports = {};
__export(searchCivilServants_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(searchCivilServants_exports);
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

// ../../apps/core/src/handlers/searchCivilServants.ts
var normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();
var matches = (actual, expected) => {
  const query = normalize(expected);
  if (!query) return true;
  return normalize(actual).includes(query);
};
var handler = async (event) => {
  try {
    const firstName = event.queryStringParameters?.firstName ?? '';
    const familyName = event.queryStringParameters?.familyName ?? '';
    const occupation = event.queryStringParameters?.occupation ?? '';
    const site = event.queryStringParameters?.site ?? '';
    if (![firstName, familyName, occupation, site].some((value) => normalize(value))) {
      return json(200, []);
    }
    const results = [];
    let exclusiveStartKey;
    do {
      const response = await dynamo.send(
        new import_lib_dynamodb2.ScanCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          ExclusiveStartKey: exclusiveStartKey,
        })
      );
      for (const item of response.Items ?? []) {
        const record = item;
        if (record.entityType !== 'civil-servant') continue;
        if (normalize(record.status) !== 'active') continue;
        if (!matches(record.firstName, firstName)) continue;
        if (!matches(record.familyName, familyName)) continue;
        if (!matches(record.occupation, occupation)) continue;
        if (!matches(record.primarySite, site)) continue;
        results.push({
          civilServantId: record.civilServantId ?? record.profileId,
          firstName: record.firstName ?? '',
          familyName: record.familyName ?? '',
          occupation: record.occupation ?? '',
          primarySite: record.primarySite ?? '',
          guardToken: record.qrToken ?? '',
          accountNumber: record.accountNumber ?? record.profileId ?? '',
          status: record.status ?? 'active',
        });
        if (results.length >= 20) {
          return json(200, results);
        }
      }
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return json(200, results);
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
