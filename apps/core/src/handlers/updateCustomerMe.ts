import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  dynamo,
  ensureProfileAccountState,
  findProfileByCognitoIdentity,
  json,
  requireEnv,
} from '../lib/shared';

type UpdateCustomerMeBody = {
  firstName?: string;
  familyName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
};

const normalize = (value: unknown) => String(value ?? '').trim();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const body = event.body ? (JSON.parse(event.body) as UpdateCustomerMeBody) : {};
    const profileId = String(profile.profileId ?? '').trim();

    if (!profileId) {
      return json(404, { message: 'Profile not found.' });
    }

    const firstName = normalize(body.firstName);
    const familyName = normalize(body.familyName);
    const phoneNumber = normalize(body.phoneNumber);
    const email = normalize(body.email);
    const address = normalize(body.address);
    const displayName = [firstName, familyName].filter(Boolean).join(' ').trim();
    const now = new Date().toISOString();

    if (!firstName || !familyName || !email || !address) {
      return json(400, {
        message: 'firstName, familyName, email, and address are required.',
      });
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId },
        UpdateExpression: [
          'SET firstName = :firstName',
          'familyName = :familyName',
          'displayName = :displayName',
          'phoneNumber = :phoneNumber',
          'email = :email',
          'address = :address',
          'updatedAt = :updatedAt',
        ].join(', '),
        ExpressionAttributeValues: {
          ':firstName': firstName,
          ':familyName': familyName,
          ':displayName': displayName,
          ':phoneNumber': phoneNumber,
          ':email': email,
          ':address': address,
          ':updatedAt': now,
        },
      })
    );

    const resolvedProfile = await ensureProfileAccountState({
      ...profile,
      firstName,
      familyName,
      displayName,
      phoneNumber,
      email,
      address,
      updatedAt: now,
    });

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
    return json(message === 'Missing bearer token.' ? 401 : 400, { message });
  }
};
