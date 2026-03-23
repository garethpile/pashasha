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

// ../../apps/core/src/handlers/resendSignupCode.ts
var resendSignupCode_exports = {};
__export(resendSignupCode_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(resendSignupCode_exports);
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

// ../../apps/core/src/handlers/resendSignupCode.ts
var handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const username = body.username?.trim();
    if (!username) {
      return json(400, { message: 'username is required.' });
    }
    const resend = await cognito.send(
      new import_client_cognito_identity_provider2.ResendConfirmationCodeCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
      })
    );
    return json(200, {
      status: 'resent',
      codeDelivery: resend.CodeDeliveryDetails
        ? {
            destination: resend.CodeDeliveryDetails.Destination ?? '',
            medium: resend.CodeDeliveryDetails.DeliveryMedium ?? '',
          }
        : void 0,
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
