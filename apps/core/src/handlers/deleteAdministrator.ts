import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { deleteAdministratorUser, json, requireAdministratorUser } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await requireAdministratorUser(event);
    const username = event.pathParameters?.username;
    if (!username) {
      return json(400, { message: 'username is required.' });
    }
    await deleteAdministratorUser(decodeURIComponent(username));
    return json(200, { status: 'deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Missing bearer token.' ? 401 : message === 'Forbidden' ? 403 : 400;
    return json(status, { message });
  }
};
