import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { createAdministratorUser, json, requireAdministratorUser } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await requireAdministratorUser(event);
    const body = event.body
      ? (JSON.parse(event.body) as {
          firstName?: string;
          familyName?: string;
          email?: string;
          phoneNumber?: string;
          password?: string;
        })
      : {};

    if (!body.firstName || !body.familyName || !body.email) {
      return json(400, { message: 'firstName, familyName and email are required.' });
    }

    return json(
      201,
      await createAdministratorUser({
        firstName: body.firstName,
        familyName: body.familyName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: body.password,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Missing bearer token.' ? 401 : message === 'Forbidden' ? 403 : 400;
    return json(status, { message });
  }
};
