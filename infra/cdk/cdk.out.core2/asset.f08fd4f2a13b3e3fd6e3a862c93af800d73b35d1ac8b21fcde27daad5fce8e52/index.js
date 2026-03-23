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

// ../../apps/core/src/handlers/confirmSignup.ts
var confirmSignup_exports = {};
__export(confirmSignup_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(confirmSignup_exports);
var import_client_cognito_identity_provider2 = require('@aws-sdk/client-cognito-identity-provider');

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
var updateProfileStatusByUsername = async (username, status) => {
  const response = await dynamo.send(
    new import_lib_dynamodb.ScanCommand({
      TableName: requireEnv('PROFILES_TABLE_NAME'),
      ProjectionExpression: 'profileId',
      FilterExpression: 'cognitoUsername = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
      Limit: 1,
    })
  );
  const profile = response.Items?.[0];
  if (!profile?.profileId) {
    return;
  }
  await dynamo.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: requireEnv('PROFILES_TABLE_NAME'),
      Key: { profileId: profile.profileId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': /* @__PURE__ */ new Date().toISOString(),
      },
    })
  );
};

// ../../apps/core/src/handlers/confirmSignup.ts
var handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const username = body.username?.trim();
    const confirmationCode = body.confirmationCode?.trim();
    if (!username || !confirmationCode) {
      return json(400, { message: 'username and confirmationCode are required.' });
    }
    await cognito.send(
      new import_client_cognito_identity_provider2.ConfirmSignUpCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
        ConfirmationCode: confirmationCode,
      })
    );
    await updateProfileStatusByUsername(username, 'active');
    return json(200, {
      status: 'confirmed',
      nextStep: 'login',
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
