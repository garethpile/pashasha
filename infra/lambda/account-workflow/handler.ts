import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const cognito = new CognitoIdentityProviderClient({});
const dynamo = new DynamoDBClient({});
const secrets = new SecretsManagerClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE_NAME!;
const CIVIL_TABLE = process.env.CIVIL_SERVANTS_TABLE_NAME!;
const ECLIPSE_SECRET_ARN = process.env.ECLIPSE_SECRET_ARN!;

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
}

export const handler = async (event: WorkflowInput) => {
  const step = (event as any).step ?? (event as any).Step ?? 'createCognito';

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

async function createCognito(input: WorkflowInput) {
  if (input.cognitoUsername) return { ...input, step: 'createProfile' };

  const params: AdminCreateUserCommandInput = {
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

  const result = await cognito.send(new AdminCreateUserCommand(params));
  const attributes = result.User?.Attributes ?? [];
  const sub = attributes.find((a) => a?.Name === 'sub')?.Value ?? '';
  return {
    ...input,
    step: 'createProfile',
    cognitoUsername: result.User?.Username ?? input.email,
    cognitoSub: sub,
  };
}

async function createProfile(input: WorkflowInput) {
  const id = input.cognitoSub ?? input.cognitoUsername ?? `id-${Date.now()}`;
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  await dynamo.send(
    new PutItemCommand({
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

async function createEclipseCustomer(input: WorkflowInput) {
  if (input.eclipseCustomerId) return { ...input, step: 'createEclipseWallet' };

  const { apiBase, tenantId, identity, password } = await loadEclipseSecrets();
  const body = {
    firstName: input.firstName ?? '',
    lastName: input.familyName ?? '',
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

  const data = await resp.json();
  const eclipseCustomerId = data.customerId?.toString() ?? `ecust-${Date.now()}`;
  return { ...input, step: 'createEclipseWallet', eclipseCustomerId };
}

async function createEclipseWallet(input: WorkflowInput) {
  if (input.eclipseWalletId) return { ...input, step: 'updateProfile' };

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

async function updateProfile(input: WorkflowInput) {
  const table = input.type === 'customer' ? CUSTOMERS_TABLE : CIVIL_TABLE;
  const pkName = input.type === 'customer' ? 'customerId' : 'civilServantId';
  const id = (input as any).profileId ?? input.cognitoSub ?? input.cognitoUsername!;
  await dynamo.send(
    new UpdateItemCommand({
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
