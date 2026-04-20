import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  GetUserCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomUUID, timingSafeEqual } from 'crypto';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const cognito = new CognitoIdentityProviderClient({});
const secrets = new SecretsManagerClient({});

let cachedAdminApiKey: string | undefined;
let cachedPaymentCoreApiKey: string | undefined;
let cachedVoucherCoreApiKey: string | undefined;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const assertSecretKey = async (
  provided: string | undefined,
  cacheKey: 'admin' | 'payment',
  secretArnEnv: string,
  missingMessage: string,
  invalidMessage: string
) => {
  if (!provided) {
    throw new Error(missingMessage);
  }

  let expected = cacheKey === 'admin' ? cachedAdminApiKey : cachedPaymentCoreApiKey;

  if (!expected) {
    const response = await secrets.send(
      new GetSecretValueCommand({ SecretId: requireEnv(secretArnEnv) })
    );
    if (!response.SecretString) {
      throw new Error(`Secret ${secretArnEnv} is empty.`);
    }
    const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
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
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error(invalidMessage);
  }
};

export const assertAdminApiKey = async (provided?: string) =>
  assertSecretKey(
    provided,
    'admin',
    'CORE_ADMIN_API_KEY_SECRET_ARN',
    'Missing admin API key.',
    'Invalid admin API key.'
  );

export const getPaymentCoreApiKey = async (): Promise<string> => {
  if (cachedPaymentCoreApiKey) {
    return cachedPaymentCoreApiKey;
  }
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('PAYMENT_CORE_API_KEY_SECRET_ARN') })
  );
  if (!response.SecretString) {
    throw new Error('Payment core API key secret is empty.');
  }
  const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
  if (!parsed.apiKey) {
    throw new Error('Payment core API key secret missing apiKey.');
  }
  cachedPaymentCoreApiKey = parsed.apiKey;
  return cachedPaymentCoreApiKey;
};

export const getVoucherCoreApiKey = async (): Promise<string> => {
  if (cachedVoucherCoreApiKey) {
    return cachedVoucherCoreApiKey;
  }
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_CORE_API_KEY_SECRET_ARN') })
  );
  if (!response.SecretString) {
    throw new Error('Voucher core API key secret is empty.');
  }
  const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
  if (!parsed.apiKey) {
    throw new Error('Voucher core API key secret missing apiKey.');
  }
  cachedVoucherCoreApiKey = parsed.apiKey;
  return cachedVoucherCoreApiKey;
};

export const getAvailableVoucherDenominations = async (): Promise<number[]> => {
  const voucherApiKey = await getVoucherCoreApiKey();
  const response = await fetch(
    `${requireEnv('VOUCHER_API_URL').replace(/\/$/, '')}/internal/availability`,
    {
      method: 'GET',
      headers: {
        'x-core-api-key': voucherApiKey,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Voucher availability lookup failed.');
  }

  const payload = (await response.json()) as {
    denominations?: Array<{ amount?: number; availableCount?: number }>;
  };

  return (payload.denominations ?? [])
    .filter((entry) => typeof entry.amount === 'number' && (entry.availableCount ?? 0) > 0)
    .map((entry) => entry.amount as number)
    .sort((a, b) => a - b);
};

export const generateTransactionId = () => `txn_${randomUUID()}`;
export const generateProfileId = (prefix: 'cus' | 'csv') => `${prefix}_${randomUUID()}`;

const accountPrefixForProfile = (profile: Record<string, unknown>): 'CS' | 'CUST' => {
  const entityType = String(profile.entityType ?? '').toLowerCase();
  return entityType === 'customer' ? 'CUST' : 'CS';
};

const resolveAccountYear = (profile: Record<string, unknown>): number => {
  const createdAt = String(profile.createdAt ?? '').trim();
  const parsed = createdAt ? new Date(createdAt) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().getUTCFullYear();
  }
  return parsed.getUTCFullYear();
};

export const reserveNextAccountNumber = async (
  prefix: 'CS' | 'CUST',
  year: number
): Promise<string> => {
  const response = await dynamo.send(
    new UpdateCommand({
      TableName: requireEnv('ACCOUNT_SEQUENCES_TABLE_NAME'),
      Key: { sequenceKey: `${prefix}#${year}` },
      UpdateExpression: 'ADD nextValue :inc SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
    })
  );

  const nextValue = Number(response.Attributes?.nextValue ?? 0);
  return `${prefix}-${year}-${String(nextValue).padStart(8, '0')}`;
};

export const ensureProfileAccountState = async (
  profile: Record<string, unknown>
): Promise<Record<string, unknown>> => {
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
      new UpdateCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId },
        UpdateExpression: 'SET accountNumber = :accountNumber, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':accountNumber': accountNumber,
          ':updatedAt': new Date().toISOString(),
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
      new UpdateCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    nextProfile.status = 'active';
  }

  return nextProfile;
};

export const getBearerToken = (event: APIGatewayProxyEventV2): string | null => {
  const raw = event.headers.authorization ?? event.headers.Authorization;
  if (!raw) return null;
  const [scheme, token] = raw.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};

export const decodeJwtPayload = (token: string): Record<string, any> => {
  const [, payload = ''] = token.split('.');
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, any>;
};

export const requireAdministratorUser = async (event: APIGatewayProxyEventV2) => {
  const accessToken = getBearerToken(event);
  if (!accessToken) {
    throw new Error('Missing bearer token.');
  }
  const payload = decodeJwtPayload(accessToken);
  const groups = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups'].map(String)
    : payload['cognito:groups']
      ? [String(payload['cognito:groups'])]
      : [];
  if (!groups.includes('Administrators')) {
    throw new Error('Forbidden');
  }
  return getCurrentCognitoUser(event);
};

export const listAdministratorUsers = async () => {
  const response = await cognito.send(
    new ListUsersInGroupCommand({
      UserPoolId: requireEnv('USER_POOL_ID'),
      GroupName: 'Administrators',
      Limit: 60,
    })
  );

  return (response.Users ?? []).map((user) => {
    const attributes = Object.fromEntries(
      (user.Attributes ?? []).map((attribute) => [attribute.Name ?? '', attribute.Value ?? ''])
    );
    return {
      username: user.Username ?? attributes.email ?? '',
      firstName: attributes.given_name ?? '',
      familyName: attributes.family_name ?? '',
      emailLower: (attributes.email ?? '').toLowerCase(),
      phoneNumber: attributes.phone_number ?? '',
      createdAt: user.UserCreateDate?.toISOString?.(),
      status: user.UserStatus,
      enabled: user.Enabled,
    };
  });
};

export const createAdministratorUser = async (input: {
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
}) => {
  const username = input.email.trim().toLowerCase();
  if (!username) {
    throw new Error('Email is required.');
  }
  const temporaryPassword =
    input.password?.trim() ||
    `${Math.random().toString(36).slice(2, 8)}A!9${Date.now().toString().slice(-4)}`;

  const attributes = [
    { Name: 'email', Value: username },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'given_name', Value: input.firstName },
    { Name: 'family_name', Value: input.familyName },
  ];
  if (input.phoneNumber?.trim()) {
    attributes.push({ Name: 'phone_number', Value: input.phoneNumber.trim() });
  }

  const created = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: requireEnv('USER_POOL_ID'),
      Username: username,
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS',
      UserAttributes: attributes,
    })
  );

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: requireEnv('USER_POOL_ID'),
      Username: username,
      GroupName: 'Administrators',
    })
  );

  const attributesMap = Object.fromEntries(
    (created.User?.Attributes ?? []).map((attribute) => [
      attribute.Name ?? '',
      attribute.Value ?? '',
    ])
  );

  return {
    username,
    temporaryPassword,
    sub: attributesMap.sub ?? '',
  };
};

export const deleteAdministratorUser = async (username: string) => {
  await cognito.send(
    new AdminDeleteUserCommand({
      UserPoolId: requireEnv('USER_POOL_ID'),
      Username: username,
    })
  );
};

export const getCurrentCognitoUser = async (event: APIGatewayProxyEventV2) => {
  const accessToken = getBearerToken(event);
  if (!accessToken) {
    throw new Error('Missing bearer token.');
  }

  const response = await cognito.send(
    new GetUserCommand({
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

export const findProfileByCognitoIdentity = async (event: APIGatewayProxyEventV2) => {
  const user = await getCurrentCognitoUser(event);

  let profile: Record<string, unknown> | undefined;

  try {
    const response = await dynamo.send(
      new QueryCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        IndexName: 'byCognitoSub',
        KeyConditionExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':sub': user.sub,
        },
        Limit: 1,
      })
    );

    profile = response.Items?.[0] as Record<string, unknown> | undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const canFallback =
      message.includes('backfilling global secondary index') ||
      message.includes('Cannot read from backfilling global secondary index');

    if (!canFallback) {
      throw error;
    }

    const response = await dynamo.send(
      new ScanCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        FilterExpression: 'cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':sub': user.sub,
        },
      })
    );

    profile = response.Items?.[0] as Record<string, unknown> | undefined;
  }

  if (!profile) {
    throw new Error('Profile not found.');
  }

  return { profile, user };
};

export const updateProfileStatusByUsername = async (
  username: string,
  status: 'active' | 'pending-confirmation'
) => {
  const response = await dynamo.send(
    new ScanCommand({
      TableName: requireEnv('PROFILES_TABLE_NAME'),
      ProjectionExpression: 'profileId',
      FilterExpression: 'cognitoUsername = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
      Limit: 1,
    })
  );

  const profile = response.Items?.[0] as { profileId?: string } | undefined;
  if (!profile?.profileId) {
    return;
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: requireEnv('PROFILES_TABLE_NAME'),
      Key: { profileId: profile.profileId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
};
