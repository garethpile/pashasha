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

// ../../apps/core/src/handlers/signup.ts
var signup_exports = {};
__export(signup_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(signup_exports);
var import_client_cognito_identity_provider2 = require('@aws-sdk/client-cognito-identity-provider');
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
var generateProfileId = (prefix) => `${prefix}_${(0, import_crypto.randomUUID)()}`;
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

// ../../apps/core/src/handlers/signup.ts
var DEFAULT_DENOMINATIONS = [50, 100, 150];
var normalizePhoneForPlaceholder = (phoneNumber) => phoneNumber.replace(/[^0-9]/g, '') || 'unknown';
var handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const firstName = body.firstName?.trim();
    const familyName = body.familyName?.trim();
    const providedEmail = body.email?.trim().toLowerCase();
    const phoneNumber = body.phoneNumber?.trim();
    const password = body.password?.trim();
    const role = body.role === 'CUSTOMER' ? 'CUSTOMER' : 'CIVIL_SERVANT';
    const primarySite = body.primarySite?.trim();
    if (!firstName || !familyName || !password) {
      return json(400, { message: 'firstName, familyName and password are required.' });
    }
    if (!providedEmail && !phoneNumber) {
      return json(400, { message: 'Provide at least an email or phone number.' });
    }
    if (role === 'CIVIL_SERVANT' && !primarySite) {
      return json(400, { message: 'Primary site is required for civil servants.' });
    }
    const email =
      providedEmail ?? `phone.${normalizePhoneForPlaceholder(phoneNumber)}@pashasha.local`;
    const username = providedEmail ?? phoneNumber;
    const signUp = await cognito.send(
      new import_client_cognito_identity_provider2.SignUpCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: familyName },
          ...(email ? [{ Name: 'email', Value: email }] : []),
          ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
        ],
      })
    );
    await cognito.send(
      new import_client_cognito_identity_provider2.AdminAddUserToGroupCommand({
        UserPoolId: requireEnv('COGNITO_USER_POOL_ID'),
        Username: username,
        GroupName: role === 'CUSTOMER' ? 'Customers' : 'CivilServants',
      })
    );
    const now = /* @__PURE__ */ new Date().toISOString();
    const profileId = generateProfileId(role === 'CUSTOMER' ? 'cus' : 'csv');
    const normalizedRole = role === 'CUSTOMER' ? 'customer' : 'civil-servant';
    const accountNumber = await reserveNextAccountNumber(
      role === 'CUSTOMER' ? 'CUST' : 'CS',
      new Date(now).getUTCFullYear()
    );
    const occupation =
      role === 'CIVIL_SERVANT' ? body.occupation?.trim() || body.otherOccupation?.trim() || '' : '';
    await dynamo.send(
      new import_lib_dynamodb2.PutCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Item: {
          profileId,
          accountNumber,
          entityType: normalizedRole,
          cognitoUsername: username,
          cognitoSub: signUp.UserSub ?? '',
          email: providedEmail ?? '',
          phoneNumber: phoneNumber ?? '',
          firstName,
          familyName,
          displayName: `${firstName} ${familyName}`.trim(),
          address: body.address?.trim() ?? '',
          primarySite: role === 'CIVIL_SERVANT' ? (primarySite ?? '') : '',
          role,
          occupation,
          status: signUp.UserConfirmed ? 'active' : 'pending-confirmation',
          availableVoucherDenominations: role === 'CIVIL_SERVANT' ? DEFAULT_DENOMINATIONS : void 0,
          civilServantId: role === 'CIVIL_SERVANT' ? profileId : void 0,
          qrToken: role === 'CIVIL_SERVANT' ? `qr_${profileId}` : void 0,
          createdAt: now,
          updatedAt: now,
        },
      })
    );
    return json(201, {
      status: signUp.UserConfirmed ? 'confirmed' : 'confirmation-pending',
      profileId,
      username,
      codeDelivery: signUp.CodeDeliveryDetails
        ? {
            destination: signUp.CodeDeliveryDetails.Destination ?? '',
            medium: signUp.CodeDeliveryDetails.DeliveryMedium ?? '',
          }
        : void 0,
      nextStep: signUp.UserConfirmed ? 'login' : 'confirm-signup',
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
