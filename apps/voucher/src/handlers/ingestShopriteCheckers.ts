import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { assertAdminApiKey, json, requireEnv } from '../lib/shared';
import { DuplicateVoucherError, ingestShopriteCheckersVoucher } from '../lib/ingestVoucher';

const secrets = new SecretsManagerClient({});
let cachedAdminApiKey: string | undefined;

const getAdminApiKey = async () => {
  if (cachedAdminApiKey) return cachedAdminApiKey;

  const secretId = requireEnv('VOUCHER_ADMIN_API_KEY_SECRET_ARN');
  const response = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) {
    throw new Error('Voucher admin API key secret is empty.');
  }

  const parsed = JSON.parse(response.SecretString) as { apiKey?: string };
  if (!parsed.apiKey) {
    throw new Error('Voucher admin API key secret missing apiKey.');
  }

  cachedAdminApiKey = parsed.apiKey;
  return cachedAdminApiKey;
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const adminApiKey = await getAdminApiKey();
    assertAdminApiKey(
      event.headers['x-admin-api-key'] ?? event.headers['X-Admin-Api-Key'],
      adminApiKey
    );

    const body = event.body
      ? (JSON.parse(event.body) as { smsText?: string; source?: string })
      : {};
    if (typeof body.smsText !== 'string' || !body.smsText.trim()) {
      return json(400, { message: 'smsText is required.' });
    }

    const result = await ingestShopriteCheckersVoucher({
      smsText: body.smsText,
      source: body.source === 'web-admin-console' ? 'web-admin-console' : 'telegram-admin-bot',
      actorId: 'voucher-admin-api-key',
      actorType: 'administrator',
      ingestedByUserId: 'voucher-admin-api-key',
      ingestedByActorId: 'voucher-admin-api-key',
    });

    return json(201, {
      voucherId: result.voucherId,
      supplier: result.supplier,
      amount: result.amount,
      currency: result.currency,
      barcodeMasked: result.barcodeMasked,
      status: result.status,
      ingestedAt: result.ingestedAt,
      storage: {
        mode: 'encrypted-at-rest-and-application-encrypted',
        barcodeVisibleToAdmins: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing admin API key.' || message === 'Invalid admin API key.'
        ? 401
        : error instanceof DuplicateVoucherError
          ? 409
          : 400;
    return json(statusCode, { message });
  }
};
