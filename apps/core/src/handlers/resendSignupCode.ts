import { ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { cognito, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = event.body
      ? (JSON.parse(event.body) as {
          username?: string;
        })
      : {};

    const username = body.username?.trim();

    if (!username) {
      return json(400, { message: 'username is required.' });
    }

    const resend = await cognito.send(
      new ResendConfirmationCodeCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
      })
    );

    return json(200, {
      status: 'resent',
      codeDelivery: resend.CodeDeliveryDetails
        ? {
            destination: resend.CodeDeliveryDetails.Destination ?? '',
            medium: resend.CodeDeliveryDetails.DeliveryMedium ?? '',
          }
        : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
