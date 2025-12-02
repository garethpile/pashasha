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

// ../lambda/account-workflow/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(handler_exports);
var import_client_cognito_identity_provider = require('@aws-sdk/client-cognito-identity-provider');
var import_client_dynamodb = require('@aws-sdk/client-dynamodb');
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var dynamo = new import_client_dynamodb.DynamoDBClient({});
var USER_POOL_ID = process.env.USER_POOL_ID;
var CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE_NAME;
var CIVIL_TABLE = process.env.CIVIL_SERVANTS_TABLE_NAME;
var handler = async (event) => {
  const step = event.step ?? event.Step ?? 'createCognito';
  switch (step) {
    case 'createCognito':
      return await createCognito(event);
    case 'createProfile':
      return await createProfile(event);
    case 'createEclipseCustomer':
      return await createEclipseCustomer(event);
    case 'createEclipseWallet':
      return await createEclipseWallet(event);
    case 'updateProfile':
      return await updateProfile(event);
    default:
      return event;
  }
};
async function createCognito(input) {
  if (input.cognitoUsername) return { ...input, step: 'createProfile' };
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: input.email ?? input.phoneNumber ?? `user-${Date.now()}`,
    TemporaryPassword: 'TempPassw0rd!',
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      { Name: 'email', Value: input.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: input.firstName ?? '' },
      { Name: 'family_name', Value: input.familyName ?? '' },
    ],
  };
  if (input.phoneNumber) {
    params.UserAttributes?.push({ Name: 'phone_number', Value: input.phoneNumber });
  }
  const result = await cognito.send(
    new import_client_cognito_identity_provider.AdminCreateUserCommand(params)
  );
  const attributes = result.User?.Attributes ?? [];
  const sub = attributes.find((a) => a?.Name === 'sub')?.Value ?? '';
  return {
    ...input,
    step: 'createProfile',
    cognitoUsername: result.User?.Username ?? input.email,
    cognitoSub: sub,
  };
}
async function createProfile(input) {
  const id = input.cognitoSub ?? input.cognitoUsername ?? `id-${Date.now()}`;
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  await dynamo.send(
    new import_client_dynamodb.PutItemCommand({
      TableName: table,
      Item: {
        [pkName]: { S: id },
        firstName: { S: input.firstName ?? '' },
        familyName: { S: input.familyName ?? '' },
        email: { S: input.email ?? '' },
        phoneNumber: { S: input.phoneNumber ?? '' },
        address: { S: input.address ?? '' },
        status: { S: 'active' },
      },
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: { '#pk': pkName },
    })
  );
  return { ...input, step: 'createEclipseCustomer', profileId: id };
}
async function createEclipseCustomer(input) {
  const eclipseCustomerId = input.eclipseCustomerId ?? `ecust-${Date.now()}`;
  return { ...input, step: 'createEclipseWallet', eclipseCustomerId };
}
async function createEclipseWallet(input) {
  const eclipseWalletId = input.eclipseWalletId ?? `ewallet-${Date.now()}`;
  return { ...input, step: 'updateProfile', eclipseWalletId };
}
async function updateProfile(input) {
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  const id = input.profileId ?? input.cognitoSub ?? input.cognitoUsername;
  await dynamo.send(
    new import_client_dynamodb.UpdateItemCommand({
      TableName: table,
      Key: { [pkName]: { S: id } },
      UpdateExpression: 'SET eclipseCustomerId = :cid, eclipseWalletId = :wid',
      ExpressionAttributeValues: {
        ':cid': { S: input.eclipseCustomerId ?? '' },
        ':wid': { S: input.eclipseWalletId ?? '' },
      },
    })
  );
  return { ...input, step: 'done' };
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
