import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, getAvailableVoucherDenominations, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const qrToken = event.queryStringParameters?.qrToken;
    const publicId = event.queryStringParameters?.publicId;

    if (!qrToken && !publicId) {
      return json(400, { message: 'qrToken or publicId is required.' });
    }

    let item: Record<string, unknown> | undefined;
    if (qrToken) {
      const response = await dynamo.send(
        new QueryCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          IndexName: 'byQrToken',
          KeyConditionExpression: 'qrToken = :qrToken',
          ExpressionAttributeValues: {
            ':qrToken': qrToken,
          },
          Limit: 1,
        })
      );
      item = response.Items?.[0] as Record<string, unknown> | undefined;
    } else if (publicId) {
      const response = await dynamo.send(
        new GetCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          Key: { profileId: publicId },
        })
      );
      item = response.Item as Record<string, unknown> | undefined;
    }

    if (!item || item.entityType !== 'civil-servant') {
      return json(404, { message: 'Civil servant not found.' });
    }

    const liveDenominations = await getAvailableVoucherDenominations();

    return json(200, {
      recipient: {
        civilServantId: item.civilServantId,
        displayName: item.displayName,
        occupation: item.occupation,
        primarySite: item.primarySite,
        department: item.department,
        station: item.station,
        qrToken: item.qrToken,
        availableVoucherDenominations: liveDenominations,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
