import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  assertAdminApiKey,
  dynamo,
  json,
  requireEnv,
  reserveNextAccountNumber,
} from '../lib/shared';

const DEFAULT_DENOMINATIONS = [50, 100, 150];

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertAdminApiKey(event.headers['x-admin-api-key'] ?? event.headers['X-Admin-Api-Key']);

    const body = event.body
      ? (JSON.parse(event.body) as {
          civilServantId?: string;
          firstName?: string;
          familyName?: string;
          department?: string;
          station?: string;
          phoneNumber?: string;
          qrToken?: string;
          availableVoucherDenominations?: number[];
        })
      : {};

    if (!body.civilServantId || !body.firstName || !body.familyName) {
      return json(400, { message: 'civilServantId, firstName and familyName are required.' });
    }

    const now = new Date().toISOString();
    const accountNumber = await reserveNextAccountNumber('CS', new Date(now).getUTCFullYear());
    const item = {
      profileId: body.civilServantId,
      accountNumber,
      entityType: 'civil-servant',
      civilServantId: body.civilServantId,
      displayName: `${body.firstName} ${body.familyName}`.trim(),
      firstName: body.firstName,
      familyName: body.familyName,
      department: body.department ?? '',
      station: body.station ?? '',
      phoneNumber: body.phoneNumber ?? '',
      qrToken: body.qrToken ?? `qr_${body.civilServantId}`,
      availableVoucherDenominations: body.availableVoucherDenominations?.length
        ? body.availableVoucherDenominations
        : DEFAULT_DENOMINATIONS,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Item: item,
      })
    );

    return json(201, item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing admin API key.' || message === 'Invalid admin API key.' ? 401 : 400;
    return json(statusCode, { message });
  }
};
