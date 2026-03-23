import {
  AdminAddUserToGroupCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  cognito,
  dynamo,
  generateProfileId,
  json,
  requireEnv,
  reserveNextAccountNumber,
} from '../lib/shared';

const DEFAULT_DENOMINATIONS = [50, 100, 150];
const normalizePhoneForPlaceholder = (phoneNumber: string) =>
  phoneNumber.replace(/[^0-9]/g, '') || 'unknown';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = event.body
      ? (JSON.parse(event.body) as {
          firstName?: string;
          familyName?: string;
          email?: string;
          phoneNumber?: string;
          address?: string;
          role?: 'CUSTOMER' | 'CIVIL_SERVANT';
          occupation?: string;
          otherOccupation?: string;
          primarySite?: string;
          password?: string;
        })
      : {};

    const firstName = body.firstName?.trim();
    const familyName = body.familyName?.trim();
    const providedEmail = body.email?.trim().toLowerCase();
    const phoneNumber = body.phoneNumber?.trim();
    const password = body.password?.trim();
    const role = body.role === 'CUSTOMER' ? 'CUSTOMER' : 'CIVIL_SERVANT';
    const primarySite = body.primarySite?.trim();

    if (!firstName || !familyName || !password) {
      return json(400, { message: 'firstName, familyName and password are required.' });
    }
    if (!providedEmail && !phoneNumber) {
      return json(400, { message: 'Provide at least an email or phone number.' });
    }
    if (role === 'CIVIL_SERVANT' && !primarySite) {
      return json(400, { message: 'Primary site is required for civil servants.' });
    }
    const email =
      providedEmail ?? `phone.${normalizePhoneForPlaceholder(phoneNumber!)}@pashasha.local`;
    const username = providedEmail ?? phoneNumber!;
    const signUp = await cognito.send(
      new SignUpCommand({
        ClientId: requireEnv('COGNITO_USER_POOL_CLIENT_ID'),
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: familyName },
          ...(email ? [{ Name: 'email', Value: email }] : []),
          ...(phoneNumber ? [{ Name: 'phone_number', Value: phoneNumber }] : []),
        ],
      })
    );
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: requireEnv('COGNITO_USER_POOL_ID'),
        Username: username,
        GroupName: role === 'CUSTOMER' ? 'Customers' : 'CivilServants',
      })
    );

    const now = new Date().toISOString();
    const profileId = generateProfileId(role === 'CUSTOMER' ? 'cus' : 'csv');
    const normalizedRole = role === 'CUSTOMER' ? 'customer' : 'civil-servant';
    const accountNumber = await reserveNextAccountNumber(
      role === 'CUSTOMER' ? 'CUST' : 'CS',
      new Date(now).getUTCFullYear()
    );
    const occupation =
      role === 'CIVIL_SERVANT' ? body.occupation?.trim() || body.otherOccupation?.trim() || '' : '';

    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Item: {
          profileId,
          accountNumber,
          entityType: normalizedRole,
          cognitoUsername: username,
          cognitoSub: signUp.UserSub ?? '',
          email: providedEmail ?? '',
          phoneNumber: phoneNumber ?? '',
          firstName,
          familyName,
          displayName: `${firstName} ${familyName}`.trim(),
          address: body.address?.trim() ?? '',
          primarySite: role === 'CIVIL_SERVANT' ? (primarySite ?? '') : '',
          role,
          occupation,
          status: signUp.UserConfirmed ? 'active' : 'pending-confirmation',
          availableVoucherDenominations:
            role === 'CIVIL_SERVANT' ? DEFAULT_DENOMINATIONS : undefined,
          civilServantId: role === 'CIVIL_SERVANT' ? profileId : undefined,
          qrToken: role === 'CIVIL_SERVANT' ? `qr_${profileId}` : undefined,
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    return json(201, {
      status: signUp.UserConfirmed ? 'confirmed' : 'confirmation-pending',
      profileId,
      username,
      codeDelivery: signUp.CodeDeliveryDetails
        ? {
            destination: signUp.CodeDeliveryDetails.Destination ?? '',
            medium: signUp.CodeDeliveryDetails.DeliveryMedium ?? '',
          }
        : undefined,
      nextStep: signUp.UserConfirmed ? 'login' : 'confirm-signup',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
