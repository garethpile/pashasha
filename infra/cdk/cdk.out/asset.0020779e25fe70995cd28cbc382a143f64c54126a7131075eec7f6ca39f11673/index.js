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
var import_client_secrets_manager = require('@aws-sdk/client-secrets-manager');
var import_client_sns = require('@aws-sdk/client-sns');
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var dynamo = new import_client_dynamodb.DynamoDBClient({});
var secrets = new import_client_secrets_manager.SecretsManagerClient({});
var sns = new import_client_sns.SNSClient({});
var USER_POOL_ID = process.env.USER_POOL_ID;
var CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE_NAME;
var CIVIL_TABLE = process.env.CIVIL_SERVANTS_TABLE_NAME;
var ECLIPSE_SECRET_ARN = process.env.ECLIPSE_SECRET_ARN;
var ERROR_TOPIC_ARN = process.env.SIGNUP_TOPIC_ARN;
var COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME;
function unwrap(value) {
  if (!value || typeof value !== 'object') return value;
  if ('value' in value && (value.type === 0 || value.type === '0')) {
    return unwrap(value.value);
  }
  if ('Payload' in value && Object.keys(value).length === 1) {
    return unwrap(value.Payload);
  }
  return value;
}
async function incrementCounter(pk, sk) {
  const params = {
    TableName: COUNTER_TABLE_NAME,
    Key: {
      pk: { S: pk },
      sk: { S: sk },
    },
    UpdateExpression: 'ADD #val :one',
    ExpressionAttributeNames: { '#val': 'value' },
    ExpressionAttributeValues: { ':one': { N: '1' } },
    ReturnValues: 'UPDATED_NEW',
  };
  const res = await dynamo.send(new import_client_dynamodb.UpdateItemCommand(params));
  const raw = res.Attributes?.value?.N;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) {
    throw new Error('Failed to increment account counter');
  }
  return parsed;
}
var handler = async (event) => {
  const base = unwrap(event.state ?? event);
  const step = event.step ?? base.step ?? 'createCognito';
  const input = { ...base };
  const initialInvocation = !('step' in event) && !('step' in base);
  if (initialInvocation) {
    delete input.cognitoUsername;
    delete input.cognitoSub;
    delete input.profileId;
  }
  try {
    switch (step) {
      case 'createCognito':
        return await createCognito(input);
      case 'createProfile':
        return await createProfile(input);
      case 'createEclipseCustomer':
        return await createEclipseCustomer(input);
      case 'createEclipseWallet':
        return await createEclipseWallet(input);
      case 'updateProfile':
        return await updateProfile(input);
      default:
        return input;
    }
  } catch (err) {
    await publishError(err?.message ?? 'Unknown error', input);
    throw err;
  }
};
async function createCognito(input) {
  const sanitized = { ...input, cognitoUsername: void 0, cognitoSub: void 0 };
  const errors = [];
  if (!sanitized.firstName?.trim()) errors.push('firstName is required');
  if (!sanitized.familyName?.trim()) errors.push('familyName is required');
  if (!sanitized.email?.trim() && !sanitized.phoneNumber?.trim()) {
    errors.push('either email or phoneNumber is required');
  }
  if (errors.length) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  const email = sanitized.email?.trim();
  const givenName = sanitized.firstName?.trim() || 'Unknown';
  const familyName = sanitized.familyName?.trim() || 'Unknown';
  const phoneNumber = sanitized.phoneNumber?.trim();
  const today = /* @__PURE__ */ new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const username = `${familyName}-${givenName}-${yyyy}-${mm}-${dd}`;
  const resolvedEmail = email ?? `${username}@placeholder.pashasha.local`;
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    TemporaryPassword: 'TempPassw0rd!',
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      { Name: 'email', Value: resolvedEmail },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: givenName },
      { Name: 'family_name', Value: familyName },
    ],
  };
  if (phoneNumber) {
    params.UserAttributes?.push({ Name: 'phone_number', Value: phoneNumber });
  }
  let result;
  try {
    result = await cognito.send(
      new import_client_cognito_identity_provider.AdminCreateUserCommand(params)
    );
  } catch (err) {
    if (err?.name === 'UsernameExistsException') {
      throw new Error(`Cognito username already exists: ${username}`);
    }
    throw err;
  }
  const groupName =
    sanitized.type === 'civil-servant'
      ? 'CivilServants'
      : sanitized.type === 'customer'
        ? 'Customers'
        : 'Administrators';
  if (result.User?.Username) {
    await cognito.send(
      new import_client_cognito_identity_provider.AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: groupName,
        Username: result.User.Username,
      })
    );
  }
  const attributes = result.User?.Attributes ?? [];
  const sub = attributes.find((a) => a?.Name === 'sub')?.Value ?? '';
  return {
    ...sanitized,
    step: 'createProfile',
    cognitoUsername: result.User?.Username ?? email,
    cognitoSub: sub,
  };
}
async function createProfile(input) {
  if (input.type === 'civil-servant' && !input.cognitoSub) {
    throw new Error('Missing Cognito sub for civil servant profile');
  }
  const id = input.cognitoSub ?? input.cognitoUsername ?? `id-${Date.now()}`;
  const now = /* @__PURE__ */ new Date().toISOString();
  const counterPk = 'ACCOUNT_COUNTER';
  const counterSk = input.type === 'civil-servant' ? 'CIVIL_SERVANT' : 'CUSTOMER';
  const counterVal = await incrementCounter(counterPk, counterSk);
  const accountNumberPrefix = input.type === 'civil-servant' ? 'CS' : 'CU';
  const accountNumber = `${accountNumberPrefix}${String(counterVal).padStart(8, '0')}`;
  const familyNameUpper = (input.familyName ?? '').toUpperCase();
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  if (!input.profileAlreadyExists) {
    try {
      await dynamo.send(
        new import_client_dynamodb.PutItemCommand({
          TableName: table,
          Item: {
            [pkName]: { S: id },
            firstName: { S: input.firstName ?? '' },
            familyName: { S: input.familyName ?? '' },
            familyNameUpper: { S: familyNameUpper },
            email: { S: input.email ?? '' },
            phoneNumber: { S: input.phoneNumber ?? '' },
            address: { S: input.address ?? '' },
            status: { S: 'active' },
            accountNumber: { S: accountNumber },
            cognitoUsername: { S: input.cognitoUsername ?? '' },
            createdAt: { S: now },
            updatedAt: { S: now },
          },
          ConditionExpression: 'attribute_not_exists(#pk)',
          ExpressionAttributeNames: { '#pk': pkName },
        })
      );
    } catch (error) {
      if (error?.name !== 'ConditionalCheckFailedException') {
        throw error;
      }
    }
  }
  return { ...input, step: 'createEclipseCustomer', profileId: id };
}
async function createEclipseCustomer(input) {
  if (input.eclipseCustomerId) return { ...input, step: 'createEclipseWallet' };
  const normalizeName = (value) => {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length < 2) return 'Unknown';
    return trimmed.slice(0, 50);
  };
  const firstName = normalizeName(input.firstName);
  const lastName = normalizeName(input.familyName);
  const { apiBase, tenantId, identity, password } = await loadEclipseSecrets();
  const body = {
    firstName,
    lastName,
    email: input.email,
    phone1: input.phoneNumber?.replace(/^\+/, ''),
    externalUniqueId: input.cognitoSub ?? input.cognitoUsername ?? `ext-${Date.now()}`,
  };
  const resp = await fetch(`${apiBase}/tenants/${tenantId}/customers`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${identity}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Eclipse customer failed: ${resp.status} ${text}`);
  }
  let data;
  try {
    data = await resp.json();
  } catch {
    data = {};
  }
  const eclipseCustomerId =
    data.customerId?.toString() ??
    data.id?.toString() ??
    data.customer?.id?.toString() ??
    data.customer?.customerId?.toString();
  if (!eclipseCustomerId) {
    console.error('Eclipse customer response missing customerId', { body: data });
    throw new Error('Eclipse customer failed: missing customerId in response');
  }
  return { ...input, step: 'createEclipseWallet', eclipseCustomerId };
}
async function createEclipseWallet(input) {
  if (input.eclipseWalletId) return { ...input, step: 'updateProfile' };
  if (!input.eclipseCustomerId) {
    throw new Error('Eclipse wallet failed: missing eclipseCustomerId from previous step');
  }
  const { apiBase, tenantId, identity, password } = await loadEclipseSecrets();
  const body = {
    name: input.type === 'civil-servant' ? 'Civil Servant Wallet' : 'Customer Wallet',
    externalUniqueId: input.cognitoSub ?? input.cognitoUsername ?? `ext-${Date.now()}`,
    walletTypeId: 121924,
    status: 'ACTIVE',
    currency: 'ZAR',
  };
  const resp = await fetch(
    `${apiBase}/tenants/${tenantId}/customers/${input.eclipseCustomerId}/wallets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${identity}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Eclipse wallet failed: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const eclipseWalletId = data.walletId?.toString() ?? `ewallet-${Date.now()}`;
  return { ...input, step: 'updateProfile', eclipseWalletId };
}
async function updateProfile(input) {
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  const id =
    input.cognitoSub ??
    input.cognitoUsername ??
    input.profileId ??
    input.accountNumber ??
    `id-${Date.now()}`;
  if (input.type === 'civil-servant' && !input.cognitoSub) {
    throw new Error('Missing Cognito sub for civil servant update');
  }
  const now = /* @__PURE__ */ new Date().toISOString();
  const familyNameUpper = (input.familyName ?? '').toUpperCase();
  const exprParts = [
    'eclipseCustomerId = :cid',
    'eclipseWalletId = :wid',
    'firstName = if_not_exists(firstName, :fn)',
    'familyName = if_not_exists(familyName, :ln)',
    'familyNameUpper = if_not_exists(familyNameUpper, :lnUpper)',
    'email = if_not_exists(email, :em)',
    'phoneNumber = if_not_exists(phoneNumber, :ph)',
    'address = if_not_exists(address, :addr)',
    '#status = if_not_exists(#status, :status)',
    'cognitoUsername = if_not_exists(cognitoUsername, :cuname)',
    'createdAt = if_not_exists(createdAt, :created)',
    'updatedAt = :updated',
  ];
  await dynamo.send(
    new import_client_dynamodb.UpdateItemCommand({
      TableName: table,
      Key: { [pkName]: { S: id } },
      UpdateExpression: 'SET ' + exprParts.join(', '),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':cid': { S: input.eclipseCustomerId ?? '' },
        ':wid': { S: input.eclipseWalletId ?? '' },
        ':fn': { S: input.firstName ?? '' },
        ':ln': { S: input.familyName ?? '' },
        ':lnUpper': { S: familyNameUpper },
        ':em': { S: input.email ?? '' },
        ':ph': { S: input.phoneNumber ?? '' },
        ':addr': { S: input.address ?? '' },
        ':status': { S: 'active' },
        ':cuname': { S: input.cognitoUsername ?? '' },
        ':created': { S: /* @__PURE__ */ new Date().toISOString() },
        ':updated': { S: now },
      },
    })
  );
  return { ...input, step: 'done' };
}
async function loadEclipseSecrets() {
  const secret = await secrets.send(
    new import_client_secrets_manager.GetSecretValueCommand({
      SecretId: ECLIPSE_SECRET_ARN,
    })
  );
  const parsed = JSON.parse(secret.SecretString ?? '{}');
  return {
    apiBase: parsed.ECLIPSE_API_BASE,
    tenantId: parsed.ECLIPSE_TENANT_ID,
    identity: parsed.ECLIPSE_TENANT_IDENTITY,
    password: parsed.ECLIPSE_TENANT_PASSWORD,
  };
}
async function publishError(message, context) {
  if (!ERROR_TOPIC_ARN) return;
  try {
    await sns.send(
      new import_client_sns.PublishCommand({
        TopicArn: ERROR_TOPIC_ARN,
        Subject: 'Account provisioning error',
        Message: JSON.stringify(
          {
            message,
            context,
          },
          null,
          2
        ),
      })
    );
  } catch (err) {
    console.error('Failed to publish error notification', err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
