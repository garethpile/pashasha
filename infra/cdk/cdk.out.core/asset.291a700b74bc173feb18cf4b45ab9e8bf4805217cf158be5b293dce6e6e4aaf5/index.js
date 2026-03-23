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

// ../../apps/core/src/handlers/getCustomerMe.ts
var getCustomerMe_exports = {};
__export(getCustomerMe_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(getCustomerMe_exports);

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
var accountPrefixForProfile = (profile) => {
  const entityType = String(profile.entityType ?? '').toLowerCase();
  return entityType === 'customer' ? 'CUST' : 'CS';
};
var resolveAccountYear = (profile) => {
  const createdAt = String(profile.createdAt ?? '').trim();
  const parsed = createdAt ? new Date(createdAt) : /* @__PURE__ */ new Date();
  if (Number.isNaN(parsed.getTime())) {
    return /* @__PURE__ */ new Date().getUTCFullYear();
  }
  return parsed.getUTCFullYear();
};
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
var ensureProfileAccountState = async (profile) => {
  const profileId = String(profile.profileId ?? '').trim();
  if (!profileId) {
    return profile;
  }
  const nextProfile = { ...profile };
  if (!String(nextProfile.accountNumber ?? '').trim()) {
    const accountNumber = await reserveNextAccountNumber(
      accountPrefixForProfile(nextProfile),
      resolveAccountYear(nextProfile)
    );
    await dynamo.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId },
        UpdateExpression: 'SET accountNumber = :accountNumber, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':accountNumber': accountNumber,
          ':updatedAt': /* @__PURE__ */ new Date().toISOString(),
        },
      })
    );
    nextProfile.accountNumber = accountNumber;
  }
  if (
    String(nextProfile.status ?? '')
      .trim()
      .toLowerCase() === 'pending-confirmation'
  ) {
    await dynamo.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':updatedAt': /* @__PURE__ */ new Date().toISOString(),
        },
      })
    );
    nextProfile.status = 'active';
  }
  return nextProfile;
};
var getBearerToken = (event) => {
  const raw = event.headers.authorization ?? event.headers.Authorization;
  if (!raw) return null;
  const [scheme, token] = raw.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};
var getCurrentCognitoUser = async (event) => {
  const accessToken = getBearerToken(event);
  if (!accessToken) {
    throw new Error('Missing bearer token.');
  }
  const response = await cognito.send(
    new import_client_cognito_identity_provider.GetUserCommand({
      AccessToken: accessToken,
    })
  );
  const attributes = Object.fromEntries(
    (response.UserAttributes ?? []).map((attribute) => [
      attribute.Name ?? '',
      attribute.Value ?? '',
    ])
  );
  return {
    username: response.Username ?? attributes.sub ?? '',
    sub: attributes.sub ?? '',
    email: attributes.email ?? '',
    phoneNumber: attributes.phone_number ?? '',
  };
};
var findProfileByCognitoIdentity = async (event) => {
  const user = await getCurrentCognitoUser(event);
  let profile;
  try {
    const response = await dynamo.send(
      new import_lib_dynamodb.QueryCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        IndexName: 'byCognitoSub',
        KeyConditionExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':sub': user.sub,
        },
        Limit: 1,
      })
    );
    profile = response.Items?.[0];
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const canFallback =
      message.includes('backfilling global secondary index') ||
      message.includes('Cannot read from backfilling global secondary index');
    if (!canFallback) {
      throw error;
    }
    const response = await dynamo.send(
      new import_lib_dynamodb.ScanCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        FilterExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':sub': user.sub,
        },
      })
    );
    profile = response.Items?.[0];
  }
  if (!profile) {
    throw new Error('Profile not found.');
  }
  return { profile, user };
};

// ../../apps/core/src/handlers/getCustomerMe.ts
var handler = async (event) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const resolvedProfile = await ensureProfileAccountState(profile);
    return json(200, {
      customerId: resolvedProfile.profileId,
      accountNumber: resolvedProfile.accountNumber ?? resolvedProfile.profileId,
      firstName: resolvedProfile.firstName ?? '',
      familyName: resolvedProfile.familyName ?? '',
      email: resolvedProfile.email ?? '',
      phoneNumber: resolvedProfile.phoneNumber ?? '',
      address: resolvedProfile.address ?? '',
      status: resolvedProfile.status ?? 'active',
      eclipseCustomerId: resolvedProfile.eclipseCustomerId,
      eclipseWalletId: resolvedProfile.eclipseWalletId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    handler,
  });
