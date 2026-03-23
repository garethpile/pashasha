import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ensureProfileAccountState, findProfileByCognitoIdentity, json } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const resolvedProfile = await ensureProfileAccountState(profile);

    return json(200, {
      customerId: resolvedProfile.profileId,
      accountNumber: resolvedProfile.accountNumber ?? resolvedProfile.profileId,
      firstName: resolvedProfile.firstName ?? '',
      familyName: resolvedProfile.familyName ?? '',
      email: resolvedProfile.email ?? '',
      phoneNumber: resolvedProfile.phoneNumber ?? '',
      address: resolvedProfile.address ?? '',
      status: resolvedProfile.status ?? 'active',
      eclipseCustomerId: resolvedProfile.eclipseCustomerId,
      eclipseWalletId: resolvedProfile.eclipseWalletId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
