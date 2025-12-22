import { Injectable } from '@nestjs/common';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';

export interface ProvisionUserOptions {
  email: string;
  phoneNumber?: string;
  firstName: string;
  familyName: string;
  username?: string;
  groupName: 'Administrators' | 'Customers' | 'CivilServants';
}

@Injectable()
export class UserProvisioningService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') ?? 'eu-west-1';
    this.userPoolId =
      this.config.get<string>('USER_POOL_ID') ?? process.env.USER_POOL_ID ?? '';
    if (!this.userPoolId) {
      throw new Error('USER_POOL_ID is required for user provisioning');
    }
    this.client = new CognitoIdentityProviderClient({ region });
  }

  async createUser(options: ProvisionUserOptions) {
    const username = options.username ?? this.generateUsername(options);
    const temporaryPassword = this.generateTemporaryPassword();

    const createCommand = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: options.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: options.firstName },
        { Name: 'family_name', Value: options.familyName },
        ...(options.phoneNumber
          ? [{ Name: 'phone_number', Value: options.phoneNumber }]
          : []),
      ],
    });

    const response = await this.client.send(createCommand);
    await this.client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: options.groupName,
      }),
    );

    return {
      sub: this.extractSub(response),
      username,
      temporaryPassword,
    };
  }

  async deleteUser(username: string) {
    try {
      await this.client.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.userPoolId,
          Username: username,
        }),
      );
    } catch (error: any) {
      if (error?.name === 'UserNotFoundException') {
        return;
      }
      throw error;
    }
  }

  async updateNames(
    username: string,
    firstName: string,
    familyName: string,
    phoneNumber?: string,
  ) {
    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: [
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: familyName },
          ...(phoneNumber
            ? [{ Name: 'phone_number', Value: phoneNumber }]
            : []),
        ],
      }),
    );
  }

  async listUsers(groupName: ProvisionUserOptions['groupName']) {
    const results = await this.client.send(
      new ListUsersInGroupCommand({
        UserPoolId: this.userPoolId,
        GroupName: groupName,
        Limit: 60,
      }),
    );
    return (
      results.Users?.map((user) => ({
        username: user.Username ?? '',
        attributes: user.Attributes ?? [],
        status: user.UserStatus,
        enabled: user.Enabled,
        createdAt: user.UserCreateDate?.toISOString(),
      })) ?? []
    );
  }

  private extractSub(response: any) {
    const attributes: Array<{ Name?: string; Value?: string }> =
      response?.User?.Attributes ?? [];
    const sub = attributes.find((attr) => attr.Name === 'sub')?.Value;
    if (!sub) {
      throw new Error('Unable to determine Cognito user sub');
    }
    return sub;
  }

  private generateTemporaryPassword() {
    const base = Math.random().toString(36).slice(-8);
    return `Temp1!${base}`;
  }

  private generateUsername(options: ProvisionUserOptions) {
    const baseFromEmail = options.email.split('@')[0];
    const normalized = baseFromEmail.replace(/[^a-zA-Z0-9]/g, '') || 'user';
    const suffix = Date.now().toString(36).slice(-4);
    return `${normalized}-${suffix}`.toLowerCase();
  }
}
