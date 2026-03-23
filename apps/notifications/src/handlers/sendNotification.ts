import { randomUUID, timingSafeEqual } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});
const secrets = new SecretsManagerClient({});
let cachedCoreApiKey: string | undefined;
let cachedSmsConfig:
  | {
      provider?: string;
      senderId?: string;
      smsType?: 'Transactional' | 'Promotional';
      maxPrice?: string;
    }
  | undefined;

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const assertCoreApiKey = async (provided?: string) => {
  if (!provided) throw new Error('Missing core API key.');
  if (!cachedCoreApiKey) {
    const response = await secrets.send(
      new GetSecretValueCommand({ SecretId: requireEnv('NOTIFICATIONS_CORE_API_KEY_SECRET_ARN') })
    );
    const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
    if (!parsed.apiKey) throw new Error('Notifications core API key secret missing apiKey.');
    cachedCoreApiKey = parsed.apiKey;
  }
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(cachedCoreApiKey);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid core API key.');
  }
};

const getSmsConfig = async () => {
  if (cachedSmsConfig) {
    return cachedSmsConfig;
  }

  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('SMS_PROVIDER_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as {
    provider?: string;
    senderId?: string;
    smsType?: 'Transactional' | 'Promotional';
    maxPrice?: string;
  };

  cachedSmsConfig = {
    provider: parsed.provider ?? 'aws-sns',
    senderId: parsed.senderId ?? 'Pashasha',
    smsType: parsed.smsType === 'Promotional' ? 'Promotional' : 'Transactional',
    maxPrice: parsed.maxPrice,
  };

  return cachedSmsConfig;
};

const buildMessage = (notificationType: string, templateData: Record<string, unknown>): string => {
  if (notificationType === 'voucher-issued') {
    const amount = String(templateData.amountLabel ?? '').trim();
    const voucherCode = String(templateData.voucherCode ?? '').trim();
    const supplier = String(templateData.supplierName ?? 'Shoprite Checkers').trim();
    const reference = String(templateData.reference ?? '').trim();
    const payerDisplayName = String(templateData.payerDisplayName ?? '').trim();
    const barcodeLast4 = String(templateData.barcodeLast4 ?? '').trim();

    return [
      `PashashaPay: You received a ${supplier} voucher.`,
      amount ? `Amount: ${amount}` : '',
      payerDisplayName ? `From: ${payerDisplayName}` : '',
      voucherCode ? `Voucher code: ${voucherCode}` : '',
      barcodeLast4 ? `Barcode ending: ${barcodeLast4}` : '',
      reference ? `Reference: ${reference}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (notificationType === 'customer-voucher-sent') {
    const amount = String(templateData.amountLabel ?? '').trim();
    const civilServantName = String(templateData.civilServantName ?? 'the civil servant').trim();
    const supplier = String(templateData.supplierName ?? 'Shoprite Checkers').trim();
    const reference = String(templateData.reference ?? '').trim();

    return [
      `PashashaPay has successfully sent ${civilServantName} ${amount || ''} ${supplier} voucher.`
        .replace(/\s+/g, ' ')
        .trim(),
      reference ? `Reference: ${reference}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return String(templateData.message ?? notificationType).trim();
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertCoreApiKey(event.headers['x-core-api-key'] ?? event.headers['X-Core-Api-Key']);
    const body = event.body
      ? (JSON.parse(event.body) as {
          notificationType?: string;
          recipient?: { phoneNumber?: string };
          templateData?: Record<string, unknown>;
        })
      : {};
    if (!body.notificationType || !body.recipient?.phoneNumber) {
      return json(400, { message: 'notificationType and recipient.phoneNumber are required.' });
    }

    const smsConfig = await getSmsConfig();
    const messageBody = buildMessage(body.notificationType, body.templateData ?? {});
    if (!messageBody) {
      return json(400, { message: 'Unable to construct notification message.' });
    }

    const now = new Date().toISOString();
    const notificationId = `ntf_${randomUUID()}`;
    const messagePreview =
      body.notificationType === 'voucher-issued'
        ? `Voucher code ${String(body.templateData?.voucherCode ?? '').slice(-4)} sent to recipient`
        : body.notificationType;

    try {
      await sns.send(
        new PublishCommand({
          PhoneNumber: body.recipient.phoneNumber,
          Message: messageBody,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: smsConfig.senderId ?? 'Pashasha',
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: smsConfig.smsType ?? 'Transactional',
            },
            ...(smsConfig.maxPrice
              ? {
                  'AWS.SNS.SMS.MaxPrice': {
                    DataType: 'Number',
                    StringValue: smsConfig.maxPrice,
                  },
                }
              : {}),
          },
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await dynamo.send(
        new PutCommand({
          TableName: requireEnv('NOTIFICATIONS_TABLE_NAME'),
          Item: {
            notificationId,
            createdAt: now,
            recipient: body.recipient.phoneNumber,
            notificationType: body.notificationType,
            status: 'failed',
            provider: smsConfig.provider ?? 'aws-sns',
            messagePreview,
            templateData: body.templateData ?? {},
            failureReason: message,
          },
        })
      );

      return json(502, {
        notificationId,
        status: 'failed',
        provider: smsConfig.provider ?? 'aws-sns',
        message,
      });
    }

    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('NOTIFICATIONS_TABLE_NAME'),
        Item: {
          notificationId,
          createdAt: now,
          recipient: body.recipient.phoneNumber,
          notificationType: body.notificationType,
          status: 'sent',
          provider: smsConfig.provider ?? 'aws-sns',
          messagePreview,
          templateData: body.templateData ?? {},
        },
      })
    );

    return json(200, {
      notificationId,
      status: 'sent',
      provider: smsConfig.provider ?? 'aws-sns',
      sentAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing core API key.' || message === 'Invalid core API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
