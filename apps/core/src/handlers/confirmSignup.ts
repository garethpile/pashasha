import { ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { cognito, json, requireEnv, updateProfileStatusByUsername } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = event.body
      ? (JSON.parse(event.body) as {
          username?: string;
          confirmationCode?: string;
        })
      : {};

    const username = body.username?.trim();
    const confirmationCode = body.confirmationCode?.trim();

    if (!username || !confirmationCode) {
      return json(400, { message: 'username and confirmationCode are required.' });
    }

    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
        ConfirmationCode: confirmationCode,
      })
    );
    await updateProfileStatusByUsername(username, 'active');

    return json(200, {
      status: 'confirmed',
      nextStep: 'login',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
