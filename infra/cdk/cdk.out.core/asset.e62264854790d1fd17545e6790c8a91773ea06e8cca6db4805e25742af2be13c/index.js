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

// ../../apps/core/src/handlers/checkEmail.ts
var checkEmail_exports = {};
__export(checkEmail_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(checkEmail_exports);
var import_client_cognito_identity_provider2 = require('@aws-sdk/client-cognito-identity-provider');
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

// ../../apps/core/src/handlers/checkEmail.ts
var handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email?.trim().toLowerCase();
    if (!email) {
      return json(400, { message: 'email is required.' });
    }
    const profileScan = await dynamo.send(
      new import_lib_dynamodb2.ScanCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        FilterExpression: '#email = :email',
        ExpressionAttributeNames: {
          '#email': 'email',
        },
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      })
    );
    const profile = profileScan.Items?.[0];
    if (profile?.entityType) {
      return json(200, {
        exists: true,
        type: profile.entityType === 'civil-servant' ? 'civil-servant' : 'customer',
      });
    }
    const users = await cognito.send(
      new import_client_cognito_identity_provider2.ListUsersCommand({
        UserPoolId: requireEnv('COGNITO_USER_POOL_ID'),
        Filter: `email = "${email}"`,
        Limit: 1,
      })
    );
    return json(200, {
      exists: (users.Users?.length ?? 0) > 0,
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
