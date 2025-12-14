import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

const cognito = new CognitoIdentityProviderClient({});
const dynamo = new DynamoDBClient({});
const secrets = new SecretsManagerClient({});
const sns = new SNSClient({});
const s3 = new S3Client({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE_NAME!;
const CIVIL_TABLE = process.env.CIVIL_SERVANTS_TABLE_NAME!;
const ECLIPSE_SECRET_ARN = process.env.ECLIPSE_SECRET_ARN!;
const ERROR_TOPIC_ARN = process.env.SIGNUP_TOPIC_ARN;
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME!;
const USER_ASSETS_BUCKET = process.env.USER_ASSETS_BUCKET;
const GUARD_PORTAL_BASE =
  (process.env.GUARD_PORTAL_BASE_URL ?? 'https://main.d2vxflzymkt19g.amplifyapp.com') + '/g?token=';

type AccountType = 'customer' | 'civil-servant';

interface WorkflowInput {
  type: AccountType;
  firstName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  cognitoUsername?: string;
  cognitoSub?: string;
  accountNumber?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
  profileAlreadyExists?: boolean;
  password?: string;
  guardToken?: string;
  qrCodeKey?: string;
}

function unwrap(value: any): any {
  if (!value || typeof value !== 'object') return value;

  // Unwrap Lambda streaming shapes { type: 0, value: {...} }
  if ('value' in value && (value.type === 0 || value.type === '0')) {
    return unwrap((value as any).value);
  }

  // Unwrap Step Functions Lambda responses { Payload: {...} }
  if ('Payload' in value && Object.keys(value).length === 1) {
    return unwrap((value as any).Payload);
  }

  return value;
}

async function incrementCounter(pk: string, sk: string): Promise<number> {
  const params: UpdateItemCommandInput = {
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

  const res = await dynamo.send(new UpdateItemCommand(params));
  const raw = res.Attributes?.value?.N;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) {
    throw new Error('Failed to increment account counter');
  }
  return parsed;
}

export const handler = async (event: WorkflowInput) => {
  const base = unwrap((event as any).state ?? event);
  const step = (event as any).step ?? (base as any).step ?? 'createCognito';

  const input = { ...(base as any) } as WorkflowInput;

  // Only strip identifiers on the initial invocation (directly from the UI/API).
  const initialInvocation = !('step' in (event as any)) && !('step' in (base as any));
  if (initialInvocation) {
    delete (input as any).cognitoUsername;
    delete (input as any).cognitoSub;
    delete (input as any).profileId;
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
      case 'ensureGuardAssets':
        return await ensureGuardAssets(input);
      case 'updateProfile':
        return await updateProfile(input);
      default:
        return input;
    }
  } catch (err: any) {
    await publishError(err?.message ?? 'Unknown error', input);
    throw err;
  }
};

async function createCognito(input: WorkflowInput) {
  // Always create a fresh Cognito user; ignore incoming admin Cognito identifiers
  const sanitized: WorkflowInput = { ...input, cognitoUsername: undefined, cognitoSub: undefined };

  const errors: string[] = [];
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

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const username = `${familyName}-${givenName}-${yyyy}-${mm}-${dd}`;
  const resolvedEmail = email ?? `${username}@placeholder.pashasha.local`;
  const tempPassword = sanitized.password?.trim() || 'TempPassw0rd!';

  const params: AdminCreateUserCommandInput = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    TemporaryPassword: tempPassword,
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
    result = await cognito.send(new AdminCreateUserCommand(params));
  } catch (err: any) {
    if (err?.name === 'UsernameExistsException') {
      throw new Error(`Cognito username already exists: ${username}`);
    }
    throw err;
  }

  // Make password permanent to avoid forced reset on first login.
  try {
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: result.User?.Username ?? username,
        Password: tempPassword,
        Permanent: true,
      })
    );
  } catch (err) {
    console.error('Failed to set permanent password', err);
    // continue; user can still force-change if needed
  }

  const groupName =
    sanitized.type === 'civil-servant'
      ? 'CivilServants'
      : sanitized.type === 'customer'
        ? 'Customers'
        : 'Administrators';

  if (result.User?.Username) {
    await cognito.send(
      new AdminAddUserToGroupCommand({
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
    password: undefined,
    step: 'createProfile',
    cognitoUsername: result.User?.Username ?? email,
    cognitoSub: sub,
  };
}

async function createProfile(input: WorkflowInput) {
  if (input.type === 'civil-servant' && !input.cognitoSub) {
    throw new Error('Missing Cognito sub for civil servant profile');
  }
  const id = input.cognitoSub ?? input.cognitoUsername ?? `id-${Date.now()}`;
  const now = new Date().toISOString();
  const counterPk = 'ACCOUNT_COUNTER';
  const counterSk = input.type === 'civil-servant' ? 'CIVIL_SERVANT' : 'CUSTOMER';
  const counterVal = await incrementCounter(counterPk, counterSk);
  const accountNumberPrefix = input.type === 'civil-servant' ? 'CS' : 'CU';
  const accountNumber = `${accountNumberPrefix}${String(counterVal).padStart(8, '0')}`;
  const familyNameUpper = (input.familyName ?? '').toUpperCase();
  const emailLower = (input.email ?? '').trim().toLowerCase();

  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';

  if (!input.profileAlreadyExists) {
    try {
      await dynamo.send(
        new PutItemCommand({
          TableName: table,
          Item: {
            [pkName]: { S: id },
            firstName: { S: input.firstName ?? '' },
            familyName: { S: input.familyName ?? '' },
            familyNameUpper: { S: familyNameUpper },
            email: { S: input.email ?? '' },
            emailLower: { S: emailLower },
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
    } catch (error: any) {
      if (error?.name !== 'ConditionalCheckFailedException') {
        throw error;
      }
    }
  }

  return { ...input, step: 'createEclipseCustomer', profileId: id };
}

async function createEclipseCustomer(input: WorkflowInput) {
  if (input.eclipseCustomerId) return { ...input, step: 'createEclipseWallet' };

  const normalizeName = (value?: string) => {
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

  let data: any;
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

async function createEclipseWallet(input: WorkflowInput) {
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
  return { ...input, step: 'ensureGuardAssets', eclipseWalletId };
}

async function ensureGuardAssets(input: WorkflowInput) {
  if (input.type !== 'civil-servant') {
    return { ...input, step: 'updateProfile' };
  }

  if (!USER_ASSETS_BUCKET) {
    console.warn('USER_ASSETS_BUCKET is not set; skipping QR creation');
    return { ...input, step: 'updateProfile' };
  }

  if (input.guardToken && input.qrCodeKey) {
    return { ...input, step: 'updateProfile' };
  }

  const token = randomUUID().replace(/-/g, '').slice(0, 16);
  const landingUrl = GUARD_PORTAL_BASE + encodeURIComponent(token);
  const buffer = await QRCode.toBuffer(landingUrl, {
    width: 512,
    margin: 1,
    type: 'png',
    errorCorrectionLevel: 'H',
  });
  const civilServantId =
    input.cognitoSub ?? input.cognitoUsername ?? input.accountNumber ?? `id-${Date.now()}`;
  const key = `qr/${civilServantId}/${token}.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: USER_ASSETS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    })
  );

  return { ...input, step: 'updateProfile', guardToken: token, qrCodeKey: key };
}

async function updateProfile(input: WorkflowInput) {
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  const id =
    input.cognitoSub ??
    input.cognitoUsername ??
    (input as any).profileId ??
    input.accountNumber ??
    `id-${Date.now()}`;

  if (input.type === 'civil-servant' && !input.cognitoSub) {
    throw new Error('Missing Cognito sub for civil servant update');
  }
  const now = new Date().toISOString();
  const familyNameUpper = (input.familyName ?? '').toUpperCase();
  const emailLower = (input.email ?? '').trim().toLowerCase();

  const exprParts = [
    'eclipseCustomerId = :cid',
    'eclipseWalletId = :wid',
    'guardToken = if_not_exists(guardToken, :gtoken)',
    'qrCodeKey = if_not_exists(qrCodeKey, :qr)',
    'firstName = if_not_exists(firstName, :fn)',
    'familyName = if_not_exists(familyName, :ln)',
    'familyNameUpper = if_not_exists(familyNameUpper, :lnUpper)',
    'email = if_not_exists(email, :em)',
    'phoneNumber = if_not_exists(phoneNumber, :ph)',
    'address = if_not_exists(address, :addr)',
    '#status = if_not_exists(#status, :status)',
    'cognitoUsername = if_not_exists(cognitoUsername, :cuname)',
    'createdAt = if_not_exists(createdAt, :created)',
    'emailLower = if_not_exists(emailLower, :emailLower)',
    'updatedAt = :updated',
  ];

  await dynamo.send(
    new UpdateItemCommand({
      TableName: table,
      Key: { [pkName]: { S: id } },
      UpdateExpression: 'SET ' + exprParts.join(', '),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':cid': { S: input.eclipseCustomerId ?? '' },
        ':wid': { S: input.eclipseWalletId ?? '' },
        ':gtoken': { S: input.guardToken ?? '' },
        ':qr': { S: input.qrCodeKey ?? '' },
        ':fn': { S: input.firstName ?? '' },
        ':ln': { S: input.familyName ?? '' },
        ':lnUpper': { S: familyNameUpper },
        ':em': { S: input.email ?? '' },
        ':ph': { S: input.phoneNumber ?? '' },
        ':addr': { S: input.address ?? '' },
        ':status': { S: 'active' },
        ':cuname': { S: input.cognitoUsername ?? '' },
        ':created': { S: new Date().toISOString() },
        ':emailLower': { S: emailLower },
        ':updated': { S: now },
      },
    })
  );
  return { ...input, step: 'done' };
}

async function loadEclipseSecrets() {
  const secret = await secrets.send(
    new GetSecretValueCommand({
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

async function publishError(message: string, context: any) {
  if (!ERROR_TOPIC_ARN) return;
  try {
    const safeContext = { ...context };
    if (safeContext.password) {
      safeContext.password = '[REDACTED]';
    }
    await sns.send(
      new PublishCommand({
        TopicArn: ERROR_TOPIC_ARN,
        Subject: 'Account provisioning error',
        Message: JSON.stringify(
          {
            message,
            context: safeContext,
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
