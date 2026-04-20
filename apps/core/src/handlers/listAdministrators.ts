import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { json, listAdministratorUsers, requireAdministratorUser } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await requireAdministratorUser(event);
    return json(200, await listAdministratorUsers());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Missing bearer token.' ? 401 : message === 'Forbidden' ? 403 : 400;
    return json(status, { message });
  }
};
