import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import QRCode from 'qrcode';
import { docClient } from './lib/dynamo.js';
import { json, text, binary } from './lib/response.js';
import { getToken, verifyToken, isAdmin, type AuthClaims } from './lib/auth.js';
import { assertKycDocumentType, type KycRecord, type KycDocumentRecord } from './lib/kyc.js';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';
const TABLE_CUSTOMERS = process.env.CUSTOMERS_TABLE_NAME ?? '';
const TABLE_CIVIL = process.env.CIVIL_SERVANTS_TABLE_NAME ?? '';
const TABLE_ADMINS = process.env.ADMINISTRATORS_TABLE_NAME ?? '';
const TABLE_PAYMENTS = process.env.PAYMENTS_TABLE_NAME ?? '';
const TABLE_SUPPORT = process.env.SUPPORT_TABLE_NAME ?? '';
const TABLE_COUNTER = process.env.COUNTER_TABLE_NAME ?? '';

const USER_ASSETS_BUCKET = process.env.USER_ASSETS_BUCKET ?? '';
const KYC_ASSETS_BUCKET = process.env.KYC_ASSETS_BUCKET ?? '';
const QR_ASSETS_BUCKET = process.env.QR_ASSETS_BUCKET || USER_ASSETS_BUCKET;
const SUPPORT_TOPIC_ARN = process.env.SUPPORT_TOPIC_ARN;
const VOUCHER_API_BASE_URL = process.env.VOUCHER_API_BASE_URL;
const GUARD_PORTAL_BASE =
  (process.env.GUARD_PORTAL_BASE_URL ?? 'https://dev.pashasha.com') + '/g?token=';
const USER_POOL_ID = process.env.USER_POOL_ID ?? '';
const ACCOUNT_WORKFLOW_ARN = process.env.ACCOUNT_WORKFLOW_ARN ?? '';
const ADMIN_WORKFLOW_ARN = process.env.ADMIN_WORKFLOW_ARN ?? ACCOUNT_WORKFLOW_ARN;

const s3 = new S3Client({});
const sns = new SNSClient({});
const cognito = new CognitoIdentityProviderClient({});
const sfn = new SFNClient({});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const parseBody = <T>(event: APIGatewayProxyEventV2): T | null => {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  return JSON.parse(raw) as T;
};

const getClaims = async (event: APIGatewayProxyEventV2): Promise<AuthClaims | null> => {
  const token = getToken(event.headers ?? ({} as Record<string, string>));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
};

const requireAuth = (claims: AuthClaims | null) => {
  if (!claims?.sub) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
};

const requireAdmin = (claims: AuthClaims | null) => {
  if (!claims?.sub || !isAdmin(claims)) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
};

const buildResponse = (err: any): APIGatewayProxyResultV2 => {
  const status = err?.statusCode ?? 500;
  const message = err?.message ?? 'Server error';
  return json(status, { error: message }, corsHeaders);
};

const incrementCounter = async (pk: string, sk: string): Promise<number> => {
  const res = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_COUNTER,
      Key: { pk, sk },
      UpdateExpression: 'ADD #v :inc',
      ExpressionAttributeNames: { '#v': 'value' },
      ExpressionAttributeValues: { ':inc': 1 },
      ReturnValues: 'UPDATED_NEW',
    })
  );
  const raw = res.Attributes?.value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error('Failed to increment counter');
  return parsed;
};

const MAX_KYC_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const listCivilServants = async (familyName?: string, accountNumber?: string) => {
  if (accountNumber) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_CIVIL,
        IndexName: 'accountNumber',
        KeyConditionExpression: 'accountNumber = :acc',
        ExpressionAttributeValues: { ':acc': accountNumber },
      })
    );
    return res.Items ?? [];
  }
  if (familyName) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_CIVIL,
        IndexName: 'familyNameUpper',
        KeyConditionExpression: 'familyNameUpper = :name',
        ExpressionAttributeValues: { ':name': familyName.toUpperCase() },
      })
    );
    return res.Items ?? [];
  }
  const res = await docClient.send(new ScanCommand({ TableName: TABLE_CIVIL, Limit: 100 }));
  return res.Items ?? [];
};

const listCustomers = async (familyName?: string, accountNumber?: string) => {
  if (accountNumber) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_CUSTOMERS,
        IndexName: 'accountNumber',
        KeyConditionExpression: 'accountNumber = :acc',
        ExpressionAttributeValues: { ':acc': accountNumber },
      })
    );
    return res.Items ?? [];
  }
  if (familyName) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_CUSTOMERS,
        IndexName: 'familyNameUpper',
        KeyConditionExpression: 'familyNameUpper = :name',
        ExpressionAttributeValues: { ':name': familyName.toUpperCase() },
      })
    );
    return res.Items ?? [];
  }
  const res = await docClient.send(new ScanCommand({ TableName: TABLE_CUSTOMERS, Limit: 100 }));
  return res.Items ?? [];
};

const getProfileById = async (table: string, keyName: string, id: string) => {
  const res = await docClient.send(new GetCommand({ TableName: table, Key: { [keyName]: id } }));
  return res.Item ?? null;
};

const getKycRecord = (profile: any | null): KycRecord => {
  if (profile?.kyc?.status && profile?.kyc?.documents) {
    return profile.kyc as KycRecord;
  }
  return {
    status: 'not_started',
    documents: {},
    updatedAt: new Date().toISOString(),
  };
};

const updateProfile = async (
  table: string,
  keyName: string,
  id: string,
  updates: Record<string, any>
) => {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    const attr = `#${key}`;
    const val = `:${key}`;
    expressions.push(`${attr} = ${val}`);
    names[attr] = key;
    values[val] = value;
  });

  if (updates.familyName) {
    expressions.push('#familyNameUpper = :familyNameUpper');
    names['#familyNameUpper'] = 'familyNameUpper';
    values[':familyNameUpper'] = updates.familyName.toUpperCase();
  }
  if (updates.email) {
    expressions.push('#emailLower = :emailLower');
    names['#emailLower'] = 'emailLower';
    values[':emailLower'] = updates.email.trim().toLowerCase();
  }

  expressions.push('#updatedAt = :updatedAt');
  names['#updatedAt'] = 'updatedAt';
  values[':updatedAt'] = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: table,
      Key: { [keyName]: id },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
};

const updateKyc = async (table: string, keyName: string, id: string, kyc: KycRecord) => {
  await docClient.send(
    new UpdateCommand({
      TableName: table,
      Key: { [keyName]: id },
      UpdateExpression: 'SET #kyc = :kyc, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#kyc': 'kyc',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':kyc': kyc,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
};

const listPaymentsByCustomer = async (customerId: string, limit = 20, offset = 0) => {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_PAYMENTS,
      IndexName: 'byCustomer',
      KeyConditionExpression: 'customerId = :cid',
      ExpressionAttributeValues: { ':cid': customerId },
      Limit: Math.max(limit, 20),
    })
  );
  const items = (res.Items ?? []) as any[];
  return items
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(offset, offset + limit);
};

const listPaymentsByCivilServant = async (civilServantId: string, limit = 20, offset = 0) => {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_PAYMENTS,
      IndexName: 'byCivilServant',
      KeyConditionExpression: 'civilServantId = :cid',
      ExpressionAttributeValues: { ':cid': civilServantId },
      Limit: Math.max(limit, 20),
    })
  );
  const items = (res.Items ?? []) as any[];
  return items
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(offset, offset + limit);
};

const createCognitoUser = async (input: {
  type: 'customer' | 'civil-servant' | 'administrator';
  firstName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}) => {
  if (!USER_POOL_ID) {
    throw Object.assign(new Error('Cognito user pool not configured'), { statusCode: 500 });
  }

  const firstName = input.firstName?.trim() || 'Unknown';
  const familyName = input.familyName?.trim() || 'Unknown';
  const email = input.email?.trim();
  const phoneNumber = input.phoneNumber?.trim();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const username = `${familyName}-${firstName}-${yyyy}-${mm}-${dd}`;
  const resolvedEmail = email ?? `${username}@placeholder.pashasha.local`;
  const tempPassword = input.password?.trim() || 'TempPassw0rd!';

  const create = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      TemporaryPassword: tempPassword,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: resolvedEmail },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: familyName },
        ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
      ],
    })
  );

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: create.User?.Username ?? username,
      Password: tempPassword,
      Permanent: true,
    })
  );

  const groupName =
    input.type === 'administrator'
      ? 'Administrators'
      : input.type === 'civil-servant'
        ? 'CivilServants'
        : 'Customers';

  if (create.User?.Username) {
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: groupName,
        Username: create.User.Username,
      })
    );
  }

  const sub = create.User?.Attributes?.find((attr) => attr?.Name === 'sub')?.Value ?? '';
  return {
    username: create.User?.Username ?? username,
    sub,
    temporaryPassword: tempPassword,
  };
};

const startAccountWorkflow = async (payload: Record<string, any>) => {
  if (!ACCOUNT_WORKFLOW_ARN) {
    throw Object.assign(new Error('Account workflow not configured'), { statusCode: 500 });
  }
  const res = await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: ACCOUNT_WORKFLOW_ARN,
      input: JSON.stringify(payload),
    })
  );
  return res.executionArn;
};

const startAdminWorkflow = async (payload: Record<string, any>) => {
  if (!ADMIN_WORKFLOW_ARN) {
    throw Object.assign(new Error('Admin workflow not configured'), { statusCode: 500 });
  }
  const res = await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: ADMIN_WORKFLOW_ARN,
      input: JSON.stringify(payload),
    })
  );
  return res.executionArn;
};

const getQrUrl = async (key?: string | null) => {
  if (!key || !QR_ASSETS_BUCKET) return null;
  const command = new GetObjectCommand({ Bucket: QR_ASSETS_BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  return url;
};

const generateGuardQr = async (civilServantId: string, token: string) => {
  if (!QR_ASSETS_BUCKET) return null;
  const landingUrl = GUARD_PORTAL_BASE + encodeURIComponent(token);
  const buffer = await QRCode.toBuffer(landingUrl, {
    width: 512,
    margin: 1,
    type: 'png',
    errorCorrectionLevel: 'H',
  });
  const key = `qr/${civilServantId}/${token}.png`;
  await s3.send(
    new PutObjectCommand({
      Bucket: QR_ASSETS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    })
  );
  return { key, buffer, landingUrl };
};

const presignKycUpload = async (profileId: string, documentType: string, contentType: string) => {
  if (!KYC_ASSETS_BUCKET) {
    throw Object.assign(new Error('KYC bucket not configured'), { statusCode: 500 });
  }
  const key = `kyc/${profileId}/${documentType}-${Date.now()}`;
  const command = new PutObjectCommand({
    Bucket: KYC_ASSETS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return { uploadUrl, key, bucket: KYC_ASSETS_BUCKET };
};

const getKycDocumentUrl = async (bucket: string, key: string) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 300 });
};

const recordSupportEvent = async (subject: string, message: string) => {
  if (!SUPPORT_TOPIC_ARN) return;
  await sns.send(
    new PublishCommand({ TopicArn: SUPPORT_TOPIC_ARN, Subject: subject, Message: message })
  );
};

const forwardVoucher = async (path: string, payload?: any) => {
  if (!VOUCHER_API_BASE_URL) {
    throw Object.assign(new Error('Voucher API not configured'), { statusCode: 500 });
  }
  const url = `${VOUCHER_API_BASE_URL}${path}`;
  const resp = await fetch(url, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw Object.assign(new Error(text || 'Voucher API error'), { statusCode: resp.status });
  }
  return (await resp.json()) as any;
};

const pickUserId = (claims: AuthClaims | null) => claims?.sub ?? claims?.username ?? '';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  const path = event.rawPath ?? '/';
  const method = event.requestContext.http.method.toUpperCase();
  const claims = await getClaims(event);

  try {
    // Public
    if (method === 'GET' && path === '/health') {
      return json(200, { ok: true }, corsHeaders);
    }

    if (method === 'GET' && path === '/auth/check-email') {
      const email = event.queryStringParameters?.email?.trim().toLowerCase();
      if (!email) return json(400, { error: 'missing email' }, corsHeaders);
      const customerMatch = await docClient.send(
        new QueryCommand({
          TableName: TABLE_CUSTOMERS,
          IndexName: 'email',
          KeyConditionExpression: 'emailLower = :email',
          ExpressionAttributeValues: { ':email': email },
          Limit: 1,
        })
      );
      if ((customerMatch.Items ?? []).length > 0) {
        return json(200, { exists: true, type: 'customer' }, corsHeaders);
      }
      const civilMatch = await docClient.send(
        new QueryCommand({
          TableName: TABLE_CIVIL,
          IndexName: 'email',
          KeyConditionExpression: 'emailLower = :email',
          ExpressionAttributeValues: { ':email': email },
          Limit: 1,
        })
      );
      if ((civilMatch.Items ?? []).length > 0) {
        return json(200, { exists: true, type: 'civil-servant' }, corsHeaders);
      }
      return json(200, { exists: false }, corsHeaders);
    }

    if (method === 'POST' && path === '/auth/signup') {
      const payload = parseBody<any>(event) ?? {};
      if (!payload?.firstName || !payload?.familyName || !payload?.role || !payload?.password) {
        return json(400, { error: 'missing fields' }, corsHeaders);
      }
      const role = String(payload.role).toUpperCase();
      const type = role === 'CIVIL_SERVANT' ? 'civil-servant' : 'customer';
      const executionArn = await startAccountWorkflow({
        type,
        firstName: payload.firstName,
        familyName: payload.familyName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
        occupation: payload.occupation,
        password: payload.password,
      });
      return json(200, { status: 'queued', executionArn }, corsHeaders);
    }

    if (path.startsWith('/guards/')) {
      const [, , token, action] = path.split('/');
      if (method === 'GET' && token && !action) {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CIVIL,
            IndexName: 'guardToken',
            KeyConditionExpression: 'guardToken = :token',
            ExpressionAttributeValues: { ':token': token },
            Limit: 1,
          })
        );
        const guard = (result.Items ?? [])[0] as any;
        if (!guard) return json(404, { error: 'Guard not found' }, corsHeaders);
        return json(
          200,
          {
            id: guard.civilServantId,
            token,
            name: `Officer ${guard.firstName} ${guard.familyName}`,
            location: guard.address ?? 'Assigned site',
            shift: 'On duty',
            yearsOfService: 1,
            motto: 'Dedicated to your safety.',
            photoUrl: '/guard-placeholder.svg',
            payoutChannel: 'manual',
            quickAmounts: [20, 50, 100, 150],
            lastUpdated: guard.updatedAt ?? new Date().toISOString(),
          },
          corsHeaders
        );
      }

      if (method === 'POST' && token && action === 'tips') {
        const payload = parseBody<any>(event) ?? {};
        const amount = Number(payload.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return json(400, { error: 'invalid amount' }, corsHeaders);
        }
        const paymentId = randomUUID();
        const now = new Date().toISOString();
        const guard = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CIVIL,
            IndexName: 'guardToken',
            KeyConditionExpression: 'guardToken = :token',
            ExpressionAttributeValues: { ':token': token },
            Limit: 1,
          })
        );
        const guardProfile = (guard.Items ?? [])[0] as any;
        if (!guardProfile) {
          return json(404, { error: 'Guard not found' }, corsHeaders);
        }
        await docClient.send(
          new PutCommand({
            TableName: TABLE_PAYMENTS,
            Item: {
              paymentId,
              status: 'PENDING',
              amount,
              currency: payload.currency ?? 'ZAR',
              guardToken: token,
              civilServantId: guardProfile.civilServantId,
              customerId: payload.customerId,
              createdAt: now,
              updatedAt: now,
              metadata: {
                yourReference: payload.yourReference ?? null,
                theirReference: payload.theirReference ?? null,
              },
            },
          })
        );
        if (VOUCHER_API_BASE_URL) {
          await forwardVoucher('/credits', {
            recipientId: guardProfile.civilServantId,
            amount,
            reference: paymentId,
            source: 'tip',
          });
          await docClient.send(
            new UpdateCommand({
              TableName: TABLE_PAYMENTS,
              Key: { paymentId },
              UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'SUCCESSFUL',
                ':updatedAt': new Date().toISOString(),
              },
            })
          );
        }
        return json(201, { paymentId, status: 'PENDING', authorizationUrl: null }, corsHeaders);
      }

      if (method === 'GET' && token && action === 'qr') {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CIVIL,
            IndexName: 'guardToken',
            KeyConditionExpression: 'guardToken = :token',
            ExpressionAttributeValues: { ':token': token },
            Limit: 1,
          })
        );
        const guard = (result.Items ?? [])[0] as any;
        if (!guard) return json(404, { error: 'Guard not found' }, corsHeaders);
        const landingUrl = GUARD_PORTAL_BASE + encodeURIComponent(token);
        const buffer = await QRCode.toBuffer(landingUrl, { width: 512, margin: 1, type: 'png' });
        return binary(200, buffer, { ...corsHeaders, 'Content-Type': 'image/png' });
      }

      if (method === 'POST' && token && action === 'topup-sandbox') {
        const payload = parseBody<any>(event) ?? {};
        const amount = Number(payload.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return json(400, { error: 'invalid amount' }, corsHeaders);
        }
        const guard = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CIVIL,
            IndexName: 'guardToken',
            KeyConditionExpression: 'guardToken = :token',
            ExpressionAttributeValues: { ':token': token },
            Limit: 1,
          })
        );
        const guardProfile = (guard.Items ?? [])[0] as any;
        if (!guardProfile) {
          return json(404, { error: 'Guard not found' }, corsHeaders);
        }
        const paymentId = randomUUID();
        const now = new Date().toISOString();
        await docClient.send(
          new PutCommand({
            TableName: TABLE_PAYMENTS,
            Item: {
              paymentId,
              status: 'SUCCESSFUL',
              amount,
              currency: payload.currency ?? 'ZAR',
              guardToken: token,
              civilServantId: guardProfile.civilServantId,
              customerId: payload.customerId,
              createdAt: now,
              updatedAt: now,
              metadata: {
                source: 'sandbox',
              },
            },
          })
        );
        if (VOUCHER_API_BASE_URL) {
          await forwardVoucher('/credits', {
            recipientId: guardProfile.civilServantId,
            amount,
            reference: paymentId,
            source: 'sandbox',
          });
        }
        return json(
          201,
          {
            paymentId,
            status: 'SUCCESSFUL',
            authorizationUrl: null,
          },
          corsHeaders
        );
      }
    }

    if (method === 'GET' && path.startsWith('/payments/eclipse/')) {
      const paymentId = path.split('/')[3];
      if (!paymentId) return json(400, { error: 'missing paymentId' }, corsHeaders);
      const res = await docClient.send(
        new GetCommand({ TableName: TABLE_PAYMENTS, Key: { paymentId } })
      );
      if (!res.Item) return json(404, { error: 'payment not found' }, corsHeaders);
      return json(
        200,
        {
          status: res.Item.status ?? 'PENDING',
          completionUrl: null,
        },
        corsHeaders
      );
    }

    // Authenticated routes
    requireAuth(claims);

    if (method === 'GET' && path === '/customers/me') {
      const customer = await getProfileById(TABLE_CUSTOMERS, 'customerId', pickUserId(claims));
      if (!customer) return json(404, { error: 'Customer not found' }, corsHeaders);
      return json(200, customer, corsHeaders);
    }

    if (method === 'PUT' && path === '/customers/me') {
      const payload = parseBody<any>(event) ?? {};
      await updateProfile(TABLE_CUSTOMERS, 'customerId', pickUserId(claims), payload);
      const updated = await getProfileById(TABLE_CUSTOMERS, 'customerId', pickUserId(claims));
      return json(200, updated, corsHeaders);
    }

    if (path === '/customers/me/kyc' && method === 'GET') {
      const customer = await getProfileById(TABLE_CUSTOMERS, 'customerId', pickUserId(claims));
      if (!customer) return json(404, { error: 'Customer not found' }, corsHeaders);
      return json(200, getKycRecord(customer), corsHeaders);
    }

    if (path.startsWith('/customers/me/kyc/documents/')) {
      const parts = path.split('/');
      const documentType = parts[5];
      try {
        assertKycDocumentType(documentType);
      } catch (err: any) {
        return json(400, { error: err?.message ?? 'invalid document type' }, corsHeaders);
      }

      const profile = await getProfileById(TABLE_CUSTOMERS, 'customerId', pickUserId(claims));
      if (!profile) return json(404, { error: 'Customer not found' }, corsHeaders);
      const currentKyc = getKycRecord(profile);

      if (method === 'POST' && parts[6] === 'presign') {
        const payload = parseBody<any>(event) ?? {};
        const contentType = payload.contentType ?? 'application/octet-stream';
        const upload = await presignKycUpload(pickUserId(claims), documentType, contentType);
        return json(200, upload, corsHeaders);
      }

      if (method === 'POST' && parts[6] === 'confirm') {
        const payload = parseBody<any>(event) ?? {};
        if (!payload.key || !payload.bucket || !payload.contentType) {
          return json(400, { error: 'missing kyc document details' }, corsHeaders);
        }
        if (payload.size && payload.size > MAX_KYC_FILE_SIZE_BYTES) {
          return json(400, { error: 'file too large' }, corsHeaders);
        }
        const now = new Date().toISOString();
        const nextDocuments = {
          ...currentKyc.documents,
          [documentType]: {
            bucket: payload.bucket,
            key: payload.key,
            contentType: payload.contentType,
            fileName: payload.fileName,
            size: payload.size,
            uploadedAt: now,
          },
        };
        const nextKyc: KycRecord = {
          status: 'pending',
          documents: nextDocuments,
          updatedAt: now,
        };
        await updateKyc(TABLE_CUSTOMERS, 'customerId', pickUserId(claims), nextKyc);
        return json(200, nextKyc, corsHeaders);
      }

      if (method === 'GET' && parts.length === 6) {
        const doc = currentKyc.documents?.[documentType as any];
        if (!doc?.key) return json(404, { error: 'document not found' }, corsHeaders);
        const url = await getKycDocumentUrl(doc.bucket ?? KYC_ASSETS_BUCKET, doc.key);
        return json(200, { url }, corsHeaders);
      }

      if (method === 'DELETE' && parts.length === 6) {
        const nextDocuments = { ...currentKyc.documents };
        delete (nextDocuments as any)[documentType];
        const hasDocs = Object.keys(nextDocuments).length > 0;
        const now = new Date().toISOString();
        const nextKyc: KycRecord = {
          status: hasDocs ? 'pending' : 'not_started',
          documents: nextDocuments,
          updatedAt: now,
        };
        await updateKyc(TABLE_CUSTOMERS, 'customerId', pickUserId(claims), nextKyc);
        return json(200, nextKyc, corsHeaders);
      }
    }

    if (method === 'GET' && path === '/customers/me/transactions') {
      const offset = Number(event.queryStringParameters?.offset ?? 0);
      const limit = Number(event.queryStringParameters?.limit ?? 20);
      const items = await listPaymentsByCustomer(pickUserId(claims), limit, offset);
      return json(200, items, corsHeaders);
    }

    if (method === 'GET' && path === '/customers/me/transactions/sent') {
      const offset = Number(event.queryStringParameters?.offset ?? 0);
      const limit = Number(event.queryStringParameters?.limit ?? 20);
      const items = await listPaymentsByCustomer(pickUserId(claims), limit, offset);
      return json(200, items, corsHeaders);
    }

    if (method === 'GET' && path === '/customers/me/wallet') {
      return json(
        200,
        { walletId: null, balance: 0, availableBalance: 0, currentBalance: 0, currency: 'ZAR' },
        corsHeaders
      );
    }

    if (method === 'GET' && path === '/civil-servants/me') {
      const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
      return json(200, guard, corsHeaders);
    }

    if (method === 'PUT' && path === '/civil-servants/me') {
      const payload = parseBody<any>(event) ?? {};
      await updateProfile(TABLE_CIVIL, 'civilServantId', pickUserId(claims), payload);
      const updated = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      return json(200, updated, corsHeaders);
    }

    if (path === '/civil-servants/me/kyc' && method === 'GET') {
      const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
      return json(200, getKycRecord(guard), corsHeaders);
    }

    if (path.startsWith('/civil-servants/me/kyc/documents/')) {
      const parts = path.split('/');
      const documentType = parts[5];
      try {
        assertKycDocumentType(documentType);
      } catch (err: any) {
        return json(400, { error: err?.message ?? 'invalid document type' }, corsHeaders);
      }
      const profile = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      if (!profile) return json(404, { error: 'Civil servant not found' }, corsHeaders);
      const currentKyc = getKycRecord(profile);

      if (method === 'POST' && parts[6] === 'presign') {
        const payload = parseBody<any>(event) ?? {};
        const contentType = payload.contentType ?? 'application/octet-stream';
        const upload = await presignKycUpload(pickUserId(claims), documentType, contentType);
        return json(200, upload, corsHeaders);
      }

      if (method === 'POST' && parts[6] === 'confirm') {
        const payload = parseBody<any>(event) ?? {};
        if (!payload.key || !payload.bucket || !payload.contentType) {
          return json(400, { error: 'missing kyc document details' }, corsHeaders);
        }
        if (payload.size && payload.size > MAX_KYC_FILE_SIZE_BYTES) {
          return json(400, { error: 'file too large' }, corsHeaders);
        }
        const now = new Date().toISOString();
        const nextDocuments = {
          ...currentKyc.documents,
          [documentType]: {
            bucket: payload.bucket,
            key: payload.key,
            contentType: payload.contentType,
            fileName: payload.fileName,
            size: payload.size,
            uploadedAt: now,
          },
        };
        const nextKyc: KycRecord = {
          status: 'pending',
          documents: nextDocuments,
          updatedAt: now,
        };
        await updateKyc(TABLE_CIVIL, 'civilServantId', pickUserId(claims), nextKyc);
        return json(200, nextKyc, corsHeaders);
      }

      if (method === 'GET' && parts.length === 6) {
        const doc = currentKyc.documents?.[documentType as any];
        if (!doc?.key) return json(404, { error: 'document not found' }, corsHeaders);
        const url = await getKycDocumentUrl(doc.bucket ?? KYC_ASSETS_BUCKET, doc.key);
        return json(200, { url }, corsHeaders);
      }

      if (method === 'DELETE' && parts.length === 6) {
        const nextDocuments = { ...currentKyc.documents };
        delete (nextDocuments as any)[documentType];
        const hasDocs = Object.keys(nextDocuments).length > 0;
        const now = new Date().toISOString();
        const nextKyc: KycRecord = {
          status: hasDocs ? 'pending' : 'not_started',
          documents: nextDocuments,
          updatedAt: now,
        };
        await updateKyc(TABLE_CIVIL, 'civilServantId', pickUserId(claims), nextKyc);
        return json(200, nextKyc, corsHeaders);
      }
    }

    if (method === 'GET' && path === '/civil-servants/me/transactions') {
      const offset = Number(event.queryStringParameters?.offset ?? 0);
      const limit = Number(event.queryStringParameters?.limit ?? 20);
      const items = await listPaymentsByCivilServant(pickUserId(claims), limit, offset);
      return json(200, items, corsHeaders);
    }

    if (method === 'GET' && path === '/civil-servants/me/transactions/pending') {
      const offset = Number(event.queryStringParameters?.offset ?? 0);
      const limit = Number(event.queryStringParameters?.limit ?? 20);
      const items = await listPaymentsByCivilServant(pickUserId(claims), limit, offset);
      return json(200, items, corsHeaders);
    }

    if (method === 'GET' && path === '/civil-servants/lookup') {
      const firstName = event.queryStringParameters?.firstName?.trim().toLowerCase();
      const familyName = event.queryStringParameters?.familyName?.trim().toLowerCase();
      const occupation = event.queryStringParameters?.occupation?.trim().toLowerCase();
      const site = event.queryStringParameters?.site?.trim().toLowerCase();

      const res = await docClient.send(new ScanCommand({ TableName: TABLE_CIVIL, Limit: 200 }));
      const items = (res.Items ?? []) as any[];
      const filtered = items.filter((item) => {
        if (
          firstName &&
          !String(item.firstName ?? '')
            .toLowerCase()
            .includes(firstName)
        )
          return false;
        if (
          familyName &&
          !String(item.familyName ?? '')
            .toLowerCase()
            .includes(familyName)
        )
          return false;
        if (
          occupation &&
          !String(item.occupation ?? '')
            .toLowerCase()
            .includes(occupation)
        )
          return false;
        if (
          site &&
          !String(item.primarySite ?? '')
            .toLowerCase()
            .includes(site)
        )
          return false;
        return true;
      });
      return json(
        200,
        filtered.map((item) => ({
          civilServantId: item.civilServantId,
          firstName: item.firstName,
          familyName: item.familyName,
          occupation: item.occupation,
          primarySite: item.primarySite,
          guardToken: item.guardToken,
          accountNumber: item.accountNumber,
          status: item.status,
        })),
        corsHeaders
      );
    }

    if (path === '/civil-servants/me/payout') {
      const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
      if (method === 'GET') {
        if (VOUCHER_API_BASE_URL) {
          const balance = await forwardVoucher(`/recipients/${guard.civilServantId}/balance`);
          return json(
            200,
            {
              balance: balance.availableBalance ?? 0,
              availableBalance: balance.availableBalance ?? 0,
              currentBalance: balance.availableBalance ?? 0,
              currency: balance.currency ?? 'ZAR',
            },
            corsHeaders
          );
        }
        return json(200, { balance: 0, availableBalance: 0, currency: 'ZAR' }, corsHeaders);
      }
      if (method === 'POST') {
        const payload = parseBody<any>(event) ?? {};
        if (VOUCHER_API_BASE_URL) {
          const result = await forwardVoucher('/payouts', {
            recipientId: guard.civilServantId,
            amount: payload.amount,
            reference: guard.accountNumber,
          });
          return json(200, result, corsHeaders);
        }
        return json(501, { error: 'voucher payout not configured' }, corsHeaders);
      }
    }

    if (path === '/civil-servants/me/qr-code' && method === 'GET') {
      const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', pickUserId(claims));
      if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
      const url = await getQrUrl(guard.qrCodeKey as string | undefined);
      if (!url) return json(404, { error: 'QR not available' }, corsHeaders);
      return json(200, { url }, corsHeaders);
    }

    if (path.startsWith('/admin/users')) {
      requireAdmin(claims);

      if (method === 'GET' && path === '/admin/users/check-email') {
        const email = event.queryStringParameters?.email?.trim().toLowerCase();
        if (!email) return json(400, { error: 'missing email' }, corsHeaders);
        const customerMatch = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CUSTOMERS,
            IndexName: 'email',
            KeyConditionExpression: 'emailLower = :email',
            ExpressionAttributeValues: { ':email': email },
            Limit: 1,
          })
        );
        if ((customerMatch.Items ?? []).length > 0) {
          return json(200, { exists: true, type: 'customer' }, corsHeaders);
        }
        const civilMatch = await docClient.send(
          new QueryCommand({
            TableName: TABLE_CIVIL,
            IndexName: 'email',
            KeyConditionExpression: 'emailLower = :email',
            ExpressionAttributeValues: { ':email': email },
            Limit: 1,
          })
        );
        if ((civilMatch.Items ?? []).length > 0) {
          return json(200, { exists: true, type: 'civil-servant' }, corsHeaders);
        }
        const adminMatch = await docClient.send(
          new QueryCommand({
            TableName: TABLE_ADMINS,
            IndexName: 'email',
            KeyConditionExpression: 'emailLower = :email',
            ExpressionAttributeValues: { ':email': email },
            Limit: 1,
          })
        );
        if ((adminMatch.Items ?? []).length > 0) {
          return json(200, { exists: true, type: 'administrator' }, corsHeaders);
        }
        return json(200, { exists: false }, corsHeaders);
      }

      if (method === 'POST' && path === '/admin/users/civil-servants') {
        const payload = parseBody<any>(event) ?? {};
        const executionArn = await startAccountWorkflow({
          type: 'civil-servant',
          firstName: payload.firstName,
          familyName: payload.familyName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          address: payload.address,
          occupation: payload.occupation,
          password: payload.password,
        });
        return json(200, { status: 'queued', executionArn }, corsHeaders);
      }

      if (method === 'POST' && path === '/admin/users/customers') {
        const payload = parseBody<any>(event) ?? {};
        const executionArn = await startAccountWorkflow({
          type: 'customer',
          firstName: payload.firstName,
          familyName: payload.familyName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          address: payload.address,
          password: payload.password,
        });
        return json(200, { status: 'queued', executionArn }, corsHeaders);
      }

      if (path.startsWith('/admin/users/civil-servants/') && method === 'DELETE') {
        const civilServantId = path.split('/')[4];
        const profile = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        if (profile?.cognitoUsername) {
          await cognito.send(
            new AdminDeleteUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: profile.cognitoUsername,
            })
          );
        }
        await docClient.send(
          new DeleteCommand({ TableName: TABLE_CIVIL, Key: { civilServantId } })
        );
        return json(200, { status: 'deleted' }, corsHeaders);
      }

      if (path.startsWith('/admin/users/customers/') && method === 'DELETE') {
        const customerId = path.split('/')[4];
        const profile = await getProfileById(TABLE_CUSTOMERS, 'customerId', customerId);
        if (profile?.cognitoUsername) {
          await cognito.send(
            new AdminDeleteUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: profile.cognitoUsername,
            })
          );
        }
        await docClient.send(
          new DeleteCommand({ TableName: TABLE_CUSTOMERS, Key: { customerId } })
        );
        return json(200, { status: 'deleted' }, corsHeaders);
      }

      if (path === '/admin/users/administrators' && method === 'GET') {
        const res = await docClient.send(new ScanCommand({ TableName: TABLE_ADMINS, Limit: 200 }));
        return json(200, res.Items ?? [], corsHeaders);
      }

      if (path === '/admin/users/administrators' && method === 'POST') {
        const payload = parseBody<any>(event) ?? {};
        const created = await createCognitoUser({
          type: 'administrator',
          firstName: payload.firstName,
          familyName: payload.familyName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          password: payload.password,
        });
        const now = new Date().toISOString();
        await docClient.send(
          new PutCommand({
            TableName: TABLE_ADMINS,
            Item: {
              username: created.username,
              email: payload.email ?? '',
              emailLower: (payload.email ?? '').trim().toLowerCase(),
              firstName: payload.firstName,
              familyName: payload.familyName,
              phoneNumber: payload.phoneNumber,
              status: 'active',
              cognitoUsername: created.username,
              cognitoSub: created.sub,
              createdAt: now,
              updatedAt: now,
            },
          })
        );
        return json(
          200,
          {
            temporaryPassword: created.temporaryPassword,
            sub: created.sub,
            username: created.username,
          },
          corsHeaders
        );
      }

      if (path.startsWith('/admin/users/administrators/') && method === 'DELETE') {
        const username = decodeURIComponent(path.split('/')[4] ?? '');
        if (username) {
          await cognito.send(
            new AdminDeleteUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: username,
            })
          );
          await docClient.send(new DeleteCommand({ TableName: TABLE_ADMINS, Key: { username } }));
        }
        return json(200, { status: 'deleted' }, corsHeaders);
      }
    }

    if (path.startsWith('/civil-servants/') && !path.startsWith('/civil-servants/me')) {
      requireAdmin(claims);
      const parts = path.split('/');
      const civilServantId = parts[2];
      if (!civilServantId) return json(400, { error: 'missing civil servant id' }, corsHeaders);

      if (parts.length === 3 && method === 'GET') {
        const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
        return json(200, guard, corsHeaders);
      }

      if (parts.length === 3 && method === 'PUT') {
        const payload = parseBody<any>(event) ?? {};
        await updateProfile(TABLE_CIVIL, 'civilServantId', civilServantId, payload);
        const updated = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        return json(200, updated, corsHeaders);
      }

      if (parts[3] === 'transactions' && parts[4] === 'pending' && method === 'GET') {
        const offset = Number(event.queryStringParameters?.offset ?? 0);
        const limit = Number(event.queryStringParameters?.limit ?? 20);
        const items = await listPaymentsByCivilServant(civilServantId, limit, offset);
        return json(200, items, corsHeaders);
      }

      if (parts[3] === 'transactions' && method === 'GET') {
        const offset = Number(event.queryStringParameters?.offset ?? 0);
        const limit = Number(event.queryStringParameters?.limit ?? 20);
        const items = await listPaymentsByCivilServant(civilServantId, limit, offset);
        return json(200, items, corsHeaders);
      }

      if (parts[3] === 'payout' && method === 'GET') {
        if (VOUCHER_API_BASE_URL) {
          const balance = await forwardVoucher(`/recipients/${civilServantId}/balance`);
          return json(
            200,
            {
              balance: balance.availableBalance ?? 0,
              availableBalance: balance.availableBalance ?? 0,
              currency: balance.currency ?? 'ZAR',
            },
            corsHeaders
          );
        }
        return json(200, { balance: 0, availableBalance: 0, currency: 'ZAR' }, corsHeaders);
      }

      if (parts[3] === 'qr-code' && method === 'GET') {
        const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
        const url = await getQrUrl(guard.qrCodeKey as string | undefined);
        if (!url) return json(404, { error: 'QR not available' }, corsHeaders);
        return json(200, { url }, corsHeaders);
      }

      if (parts[3] === 'guard-token' && method === 'POST') {
        const token = randomUUID().replace(/-/g, '').slice(0, 16);
        const qr = await generateGuardQr(civilServantId, token);
        await updateProfile(TABLE_CIVIL, 'civilServantId', civilServantId, {
          guardToken: token,
          guardTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          qrCodeKey: qr?.key,
        });
        return json(200, { civilServantId, guardToken: token }, corsHeaders);
      }

      if (parts[3] === 'kyc' && parts.length === 4 && method === 'GET') {
        const guard = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        if (!guard) return json(404, { error: 'Civil servant not found' }, corsHeaders);
        return json(200, getKycRecord(guard), corsHeaders);
      }

      if (parts[3] === 'kyc' && parts[4] === 'documents') {
        const documentType = parts[5];
        try {
          assertKycDocumentType(documentType);
        } catch (err: any) {
          return json(400, { error: err?.message ?? 'invalid document type' }, corsHeaders);
        }
        const profile = await getProfileById(TABLE_CIVIL, 'civilServantId', civilServantId);
        if (!profile) return json(404, { error: 'Civil servant not found' }, corsHeaders);
        const currentKyc = getKycRecord(profile);

        if (method === 'POST' && parts[6] === 'presign') {
          const payload = parseBody<any>(event) ?? {};
          const contentType = payload.contentType ?? 'application/octet-stream';
          const upload = await presignKycUpload(civilServantId, documentType, contentType);
          return json(200, upload, corsHeaders);
        }

        if (method === 'POST' && parts[6] === 'confirm') {
          const payload = parseBody<any>(event) ?? {};
          if (!payload.key || !payload.bucket || !payload.contentType) {
            return json(400, { error: 'missing kyc document details' }, corsHeaders);
          }
          if (payload.size && payload.size > MAX_KYC_FILE_SIZE_BYTES) {
            return json(400, { error: 'file too large' }, corsHeaders);
          }
          const now = new Date().toISOString();
          const nextDocuments = {
            ...currentKyc.documents,
            [documentType]: {
              bucket: payload.bucket,
              key: payload.key,
              contentType: payload.contentType,
              fileName: payload.fileName,
              size: payload.size,
              uploadedAt: now,
            },
          };
          const nextKyc: KycRecord = {
            status: 'pending',
            documents: nextDocuments,
            updatedAt: now,
          };
          await updateKyc(TABLE_CIVIL, 'civilServantId', civilServantId, nextKyc);
          return json(200, nextKyc, corsHeaders);
        }

        if (method === 'GET' && parts.length === 6) {
          const doc = currentKyc.documents?.[documentType as any];
          if (!doc?.key) return json(404, { error: 'document not found' }, corsHeaders);
          const url = await getKycDocumentUrl(doc.bucket ?? KYC_ASSETS_BUCKET, doc.key);
          return json(200, { url }, corsHeaders);
        }

        if (method === 'DELETE' && parts.length === 6) {
          const nextDocuments = { ...currentKyc.documents };
          delete (nextDocuments as any)[documentType];
          const hasDocs = Object.keys(nextDocuments).length > 0;
          const now = new Date().toISOString();
          const nextKyc: KycRecord = {
            status: hasDocs ? 'pending' : 'not_started',
            documents: nextDocuments,
            updatedAt: now,
          };
          await updateKyc(TABLE_CIVIL, 'civilServantId', civilServantId, nextKyc);
          return json(200, nextKyc, corsHeaders);
        }
      }
    }

    if (path === '/civil-servants' && method === 'GET') {
      requireAdmin(claims);
      const items = await listCivilServants(
        event.queryStringParameters?.familyName,
        event.queryStringParameters?.accountNumber
      );
      return json(200, items, corsHeaders);
    }

    if (path === '/customers' && method === 'GET') {
      requireAdmin(claims);
      const items = await listCustomers(
        event.queryStringParameters?.familyName,
        event.queryStringParameters?.accountNumber
      );
      return json(200, items, corsHeaders);
    }

    if (path.startsWith('/customers/') && !path.startsWith('/customers/me')) {
      requireAdmin(claims);
      const parts = path.split('/');
      const customerId = parts[2];
      if (!customerId) return json(400, { error: 'missing customer id' }, corsHeaders);

      if (parts.length === 3 && method === 'GET') {
        const customer = await getProfileById(TABLE_CUSTOMERS, 'customerId', customerId);
        if (!customer) return json(404, { error: 'Customer not found' }, corsHeaders);
        return json(200, customer, corsHeaders);
      }

      if (parts.length === 3 && method === 'PUT') {
        const payload = parseBody<any>(event) ?? {};
        await updateProfile(TABLE_CUSTOMERS, 'customerId', customerId, payload);
        const updated = await getProfileById(TABLE_CUSTOMERS, 'customerId', customerId);
        return json(200, updated, corsHeaders);
      }

      if (parts[3] === 'transactions' && parts[4] === 'pending' && method === 'GET') {
        const offset = Number(event.queryStringParameters?.offset ?? 0);
        const limit = Number(event.queryStringParameters?.limit ?? 20);
        const items = await listPaymentsByCustomer(customerId, limit, offset);
        return json(200, items, corsHeaders);
      }

      if (parts[3] === 'transactions' && method === 'GET') {
        const offset = Number(event.queryStringParameters?.offset ?? 0);
        const limit = Number(event.queryStringParameters?.limit ?? 20);
        const items = await listPaymentsByCustomer(customerId, limit, offset);
        return json(200, items, corsHeaders);
      }

      if (parts[3] === 'wallet' && method === 'GET') {
        return json(
          200,
          { walletId: null, balance: 0, availableBalance: 0, currentBalance: 0, currency: 'ZAR' },
          corsHeaders
        );
      }

      if (parts[3] === 'kyc' && parts.length === 4 && method === 'GET') {
        const customer = await getProfileById(TABLE_CUSTOMERS, 'customerId', customerId);
        if (!customer) return json(404, { error: 'Customer not found' }, corsHeaders);
        return json(200, getKycRecord(customer), corsHeaders);
      }

      if (parts[3] === 'kyc' && parts[4] === 'documents') {
        const documentType = parts[5];
        try {
          assertKycDocumentType(documentType);
        } catch (err: any) {
          return json(400, { error: err?.message ?? 'invalid document type' }, corsHeaders);
        }
        const profile = await getProfileById(TABLE_CUSTOMERS, 'customerId', customerId);
        if (!profile) return json(404, { error: 'Customer not found' }, corsHeaders);
        const currentKyc = getKycRecord(profile);

        if (method === 'POST' && parts[6] === 'presign') {
          const payload = parseBody<any>(event) ?? {};
          const contentType = payload.contentType ?? 'application/octet-stream';
          const upload = await presignKycUpload(customerId, documentType, contentType);
          return json(200, upload, corsHeaders);
        }

        if (method === 'POST' && parts[6] === 'confirm') {
          const payload = parseBody<any>(event) ?? {};
          if (!payload.key || !payload.bucket || !payload.contentType) {
            return json(400, { error: 'missing kyc document details' }, corsHeaders);
          }
          if (payload.size && payload.size > MAX_KYC_FILE_SIZE_BYTES) {
            return json(400, { error: 'file too large' }, corsHeaders);
          }
          const now = new Date().toISOString();
          const nextDocuments = {
            ...currentKyc.documents,
            [documentType]: {
              bucket: payload.bucket,
              key: payload.key,
              contentType: payload.contentType,
              fileName: payload.fileName,
              size: payload.size,
              uploadedAt: now,
            },
          };
          const nextKyc: KycRecord = {
            status: 'pending',
            documents: nextDocuments,
            updatedAt: now,
          };
          await updateKyc(TABLE_CUSTOMERS, 'customerId', customerId, nextKyc);
          return json(200, nextKyc, corsHeaders);
        }

        if (method === 'GET' && parts.length === 6) {
          const doc = currentKyc.documents?.[documentType as any];
          if (!doc?.key) return json(404, { error: 'document not found' }, corsHeaders);
          const url = await getKycDocumentUrl(doc.bucket ?? KYC_ASSETS_BUCKET, doc.key);
          return json(200, { url }, corsHeaders);
        }

        if (method === 'DELETE' && parts.length === 6) {
          const nextDocuments = { ...currentKyc.documents };
          delete (nextDocuments as any)[documentType];
          const hasDocs = Object.keys(nextDocuments).length > 0;
          const now = new Date().toISOString();
          const nextKyc: KycRecord = {
            status: hasDocs ? 'pending' : 'not_started',
            documents: nextDocuments,
            updatedAt: now,
          };
          await updateKyc(TABLE_CUSTOMERS, 'customerId', customerId, nextKyc);
          return json(200, nextKyc, corsHeaders);
        }
      }
    }

    // Support
    if (path === '/support/prepare' && method === 'GET') {
      const code = `SUPP-${String(await incrementCounter('SUPPORT_COUNTER', 'SUPPORT')).padStart(8, '0')}`;
      return json(
        200,
        { supportCode: code, user: { sub: claims?.sub, email: claims?.email } },
        corsHeaders
      );
    }

    if (path === '/support/tickets' && method === 'POST') {
      const payload = parseBody<any>(event) ?? {};
      const summary = payload.summary ?? payload.message;
      if (!summary) return json(400, { error: 'summary is required' }, corsHeaders);
      const supportCode =
        payload.supportCode ??
        `SUPP-${String(await incrementCounter('SUPPORT_COUNTER', 'SUPPORT')).padStart(8, '0')}`;
      const now = new Date().toISOString();
      const ticket = {
        supportCode,
        customerId: pickUserId(claims),
        status: 'ACTIVE',
        summary,
        details: payload.details ?? null,
        issueType: payload.issueType ?? 'Account',
        createdAt: now,
        updatedAt: now,
        user: {
          sub: claims?.sub,
          email: claims?.email,
          groups: claims?.['cognito:groups'] ?? [],
        },
        comments: [],
      };
      await docClient.send(new PutCommand({ TableName: TABLE_SUPPORT, Item: ticket }));
      await recordSupportEvent('Support ticket created', JSON.stringify(ticket));
      return json(200, ticket, corsHeaders);
    }

    if (path === '/support/tickets' && method === 'GET') {
      const res = await docClient.send(
        new QueryCommand({
          TableName: TABLE_SUPPORT,
          IndexName: 'byCustomer',
          KeyConditionExpression: 'customerId = :cid',
          ExpressionAttributeValues: { ':cid': pickUserId(claims) },
        })
      );
      const statusFilter = event.queryStringParameters?.status?.toUpperCase();
      const items = (res.Items ?? []) as any[];
      const filtered = statusFilter
        ? items.filter((item) => String(item.status ?? '').toUpperCase() === statusFilter)
        : items;
      return json(200, { items: filtered }, corsHeaders);
    }

    if (path.startsWith('/support/tickets/') && method === 'GET') {
      const code = path.split('/')[3];
      const res = await docClient.send(
        new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
      );
      if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
      return json(200, res.Item, corsHeaders);
    }

    if (path.startsWith('/support/tickets/') && path.endsWith('/comments') && method === 'POST') {
      const code = path.split('/')[3];
      const payload = parseBody<any>(event) ?? {};
      const message = payload.message?.trim();
      if (!message) return json(400, { error: 'message required' }, corsHeaders);
      const res = await docClient.send(
        new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
      );
      if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
      const comments = (res.Item.comments ?? []) as any[];
      const updated = {
        ...res.Item,
        comments: [
          ...comments,
          {
            id: randomUUID(),
            authorType: isAdmin(claims) ? 'admin' : 'user',
            authorId: pickUserId(claims),
            authorName: claims?.email ?? 'User',
            message,
            createdAt: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: TABLE_SUPPORT, Item: updated }));
      return json(200, updated, corsHeaders);
    }

    if (path.startsWith('/support/tickets/') && path.endsWith('/status') && method === 'POST') {
      const code = path.split('/')[3];
      const payload = parseBody<any>(event) ?? {};
      const status = payload.status ?? 'ACTIVE';
      const res = await docClient.send(
        new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
      );
      if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
      const updated = {
        ...res.Item,
        status: status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: TABLE_SUPPORT, Item: updated }));
      return json(200, updated, corsHeaders);
    }

    if (path.startsWith('/support/admin')) {
      requireAdmin(claims);
      if (path === '/support/admin/tickets' && method === 'GET') {
        const res = await docClient.send(new ScanCommand({ TableName: TABLE_SUPPORT, Limit: 200 }));
        const status = event.queryStringParameters?.status?.toUpperCase();
        const supportCode = event.queryStringParameters?.supportCode?.trim();
        let items = (res.Items ?? []) as any[];
        if (status) {
          items = items.filter((item) => String(item.status ?? '').toUpperCase() === status);
        }
        if (supportCode) {
          items = items.filter((item) => String(item.supportCode ?? '').includes(supportCode));
        }
        return json(200, items, corsHeaders);
      }
      if (path.startsWith('/support/admin/tickets/') && method === 'GET') {
        const code = path.split('/')[4];
        const res = await docClient.send(
          new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
        );
        if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
        return json(200, res.Item, corsHeaders);
      }
      if (
        path.startsWith('/support/admin/tickets/') &&
        path.endsWith('/comments') &&
        method === 'POST'
      ) {
        const code = path.split('/')[4];
        const payload = parseBody<any>(event) ?? {};
        const message = payload.message?.trim();
        if (!message) return json(400, { error: 'message required' }, corsHeaders);
        const res = await docClient.send(
          new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
        );
        if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
        const comments = (res.Item.comments ?? []) as any[];
        const updated = {
          ...res.Item,
          comments: [
            ...comments,
            {
              id: randomUUID(),
              authorType: 'admin',
              authorId: pickUserId(claims),
              authorName: claims?.email ?? 'Admin',
              message,
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        await docClient.send(new PutCommand({ TableName: TABLE_SUPPORT, Item: updated }));
        return json(200, updated, corsHeaders);
      }
      if (
        path.startsWith('/support/admin/tickets/') &&
        path.endsWith('/status') &&
        method === 'POST'
      ) {
        const code = path.split('/')[4];
        const payload = parseBody<any>(event) ?? {};
        const status = payload.status ?? 'ACTIVE';
        const res = await docClient.send(
          new GetCommand({ TableName: TABLE_SUPPORT, Key: { supportCode: code } })
        );
        if (!res.Item) return json(404, { error: 'ticket not found' }, corsHeaders);
        const updated = {
          ...res.Item,
          status: status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
          updatedAt: new Date().toISOString(),
        };
        await docClient.send(new PutCommand({ TableName: TABLE_SUPPORT, Item: updated }));
        return json(200, updated, corsHeaders);
      }
    }

    return json(404, { error: 'not found' }, corsHeaders);
  } catch (err: any) {
    return buildResponse(err);
  }
};
