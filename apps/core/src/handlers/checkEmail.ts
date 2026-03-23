import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { cognito, dynamo, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const email = event.queryStringParameters?.email?.trim().toLowerCase();
    if (!email) {
      return json(400, { message: 'email is required.' });
    }

    const profileScan = await dynamo.send(
      new ScanCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        FilterExpression: '#email = :email',
        ExpressionAttributeNames: {
          '#email': 'email',
        },
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      })
    );

    const profile = profileScan.Items?.[0] as { entityType?: string } | undefined;
    if (profile?.entityType) {
      return json(200, {
        exists: true,
        type: profile.entityType === 'civil-servant' ? 'civil-servant' : 'customer',
      });
    }

    const users = await cognito.send(
      new ListUsersCommand({
        UserPoolId: requireEnv('COGNITO_USER_POOL_ID'),
        Filter: `email = "${email}"`,
        Limit: 1,
      })
    );

    return json(200, {
      exists: (users.Users?.length ?? 0) > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
