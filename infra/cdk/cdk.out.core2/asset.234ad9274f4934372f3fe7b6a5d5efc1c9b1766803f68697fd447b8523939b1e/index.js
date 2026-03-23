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

// ../../apps/core/src/handlers/listCivilServantTransactionsMe.ts
var listCivilServantTransactionsMe_exports = {};
__export(listCivilServantTransactionsMe_exports, {
  handler: () => handler,
});
module.exports = __toCommonJS(listCivilServantTransactionsMe_exports);
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

// ../../apps/core/src/handlers/listCivilServantTransactionsMe.ts
var toDashboardStatus = (status) => {
  const value = (status ?? '').toLowerCase();
  if (value === 'completed' || value === 'paid' || value === 'successful') return 'SUCCESSFUL';
  if (value.includes('pending')) return 'PENDING';
  if (value.includes('cancel') || value.includes('fail') || value.includes('error'))
    return 'FAILED';
  return (status ?? 'UNKNOWN').toUpperCase();
};
var handler = async (event) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const civilServantId = String(profile.civilServantId ?? profile.profileId ?? '').trim();
    if (!civilServantId) {
      return json(200, []);
    }
    const result = await dynamo.send(
      new import_lib_dynamodb2.QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byCivilServant',
        KeyConditionExpression: 'civilServantId = :civilServantId',
        ExpressionAttributeValues: {
          ':civilServantId': civilServantId,
        },
        ScanIndexForward: false,
      })
    );
    const wantsPending = (event.rawPath ?? event.requestContext.http.path ?? '').endsWith(
      '/pending'
    );
    const items = result.Items ?? [];
    const filtered = items.filter((item) => {
      const status = String(item.status ?? '').toLowerCase();
      return wantsPending ? status.includes('pending') : status === 'completed';
    });
    return json(
      200,
      filtered.map((item) => {
        const payerDisplayName = String(item.payerDisplayName ?? '').trim() || 'Anonymous';
        const voucherAmount = Number(
          item.voucherDenomination ?? item.voucherAmount ?? item.amount ?? 0
        );
        const supplierName =
          String(item.supplierName ?? 'Shoprite Checkers').trim() || 'Shoprite Checkers';
        return {
          paymentId: item.transactionId ?? item.paymentIntentId,
          amount: voucherAmount,
          status: toDashboardStatus(String(item.status ?? '')),
          createdAt: item.createdAt,
          paymentType: 'DIGITAL_VOUCHER',
          externalId: item.paymentIntentId ?? item.transactionId,
          metadata: {
            civilServantId: item.civilServantId,
            description: `${supplierName} voucher from ${payerDisplayName}`,
          },
          raw: {
            description: `${supplierName} voucher from ${payerDisplayName}`,
            paymentReference: item.paymentIntentId ?? item.transactionId,
          },
        };
      })
    );
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
