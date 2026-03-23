import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  dynamo,
  ensureProfileAccountState,
  findProfileByCognitoIdentity,
  json,
  requireEnv,
} from '../lib/shared';

type UpdateCivilServantMeBody = {
  firstName?: string;
  familyName?: string;
  occupation?: string;
  primarySite?: string;
  address?: string;
  homeAddress?: string;
  phoneNumber?: string;
  email?: string;
};

const normalize = (value: unknown) => String(value ?? '').trim();

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const body = event.body ? (JSON.parse(event.body) as UpdateCivilServantMeBody) : {};
    const profileId = String(profile.profileId ?? '').trim();

    if (!profileId) {
      return json(404, { message: 'Profile not found.' });
    }

    const firstName = normalize(body.firstName);
    const familyName = normalize(body.familyName);
    const occupation = normalize(body.occupation);
    const primarySite = normalize(body.primarySite);
    const homeAddress = normalize(body.homeAddress || body.address);
    const phoneNumber = normalize(body.phoneNumber);
    const email = normalize(body.email);
    const displayName = [firstName, familyName].filter(Boolean).join(' ').trim();
    const now = new Date().toISOString();

    if (!firstName || !familyName || !occupation || !primarySite || !homeAddress) {
      return json(400, {
        message: 'firstName, familyName, occupation, primarySite, and homeAddress are required.',
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
          'occupation = :occupation',
          'primarySite = :primarySite',
          'address = :address',
          'homeAddress = :homeAddress',
          'phoneNumber = :phoneNumber',
          'email = :email',
          'updatedAt = :updatedAt',
        ].join(', '),
        ExpressionAttributeValues: {
          ':firstName': firstName,
          ':familyName': familyName,
          ':displayName': displayName,
          ':occupation': occupation,
          ':primarySite': primarySite,
          ':address': primarySite,
          ':homeAddress': homeAddress,
          ':phoneNumber': phoneNumber,
          ':email': email,
          ':updatedAt': now,
        },
      })
    );

    const resolvedProfile = await ensureProfileAccountState({
      ...profile,
      firstName,
      familyName,
      displayName,
      occupation,
      primarySite,
      address: primarySite,
      homeAddress,
      phoneNumber,
      email,
      updatedAt: now,
    });

    return json(200, {
      civilServantId: resolvedProfile.civilServantId ?? resolvedProfile.profileId,
      accountNumber: resolvedProfile.accountNumber ?? resolvedProfile.profileId,
      firstName: resolvedProfile.firstName ?? '',
      familyName: resolvedProfile.familyName ?? '',
      email: resolvedProfile.email ?? '',
      phoneNumber: resolvedProfile.phoneNumber ?? '',
      address: resolvedProfile.address ?? '',
      homeAddress: resolvedProfile.homeAddress ?? resolvedProfile.address ?? '',
      occupation: resolvedProfile.occupation ?? '',
      primarySite: resolvedProfile.primarySite ?? '',
      status: resolvedProfile.status ?? 'active',
      guardToken: resolvedProfile.qrToken ?? '',
      qrCodeKey: resolvedProfile.qrToken ?? '',
      eclipseWalletId: resolvedProfile.eclipseWalletId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 400, { message });
  }
};
