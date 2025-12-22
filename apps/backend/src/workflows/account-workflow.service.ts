import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { randomUUID } from 'crypto';

type AccountType = 'customer' | 'civil-servant' | 'administrator';

interface IdentifiedProfile {
  firstName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  cognitoUsername?: string;
  cognitoSub?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
  customerId?: string;
  civilServantId?: string;
  occupation?: string;
  otherOccupation?: string;
  password?: string;
}

interface CognitoIdentityLike {
  username?: string;
  userName?: string;
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

export interface AccountWorkflowInput {
  type: AccountType;
  profileId?: string;
  profile?: IdentifiedProfile;
  cognitoUser?: CognitoIdentityLike;
  firstName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  occupation?: string;
  otherOccupation?: string;
  password?: string;
  cognitoUsername?: string;
  cognitoSub?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
  profileAlreadyExists?: boolean;
}

export interface AccountDeletionInput {
  type: AccountType;
  profileId: string;
  cognitoUsername?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
}

@Injectable()
export class AccountWorkflowService {
  private readonly logger = new Logger(AccountWorkflowService.name);
  private readonly stateMachineArnDefault?: string;
  private readonly stateMachineArnCivil?: string;
  private readonly stateMachineArnCustomer?: string;
  private readonly stateMachineArnAdmin?: string;
  private readonly deletionStateMachineArn?: string;
  private readonly clientRegion: string;
  private readonly client: SFNClient;

  constructor(private readonly config: ConfigService) {
    this.stateMachineArnDefault = this.config.get<string>(
      'ACCOUNT_WORKFLOW_ARN',
    );
    this.stateMachineArnCivil =
      this.config.get<string>('ACCOUNT_WORKFLOW_ARN_CIVIL') ??
      this.stateMachineArnDefault;
    this.stateMachineArnCustomer =
      this.config.get<string>('ACCOUNT_WORKFLOW_ARN_CUSTOMER') ??
      this.stateMachineArnDefault;
    this.stateMachineArnAdmin =
      this.config.get<string>('ACCOUNT_WORKFLOW_ARN_ADMINISTRATOR') ??
      this.stateMachineArnDefault;
    this.deletionStateMachineArn = this.config.get<string>(
      'ACCOUNT_DELETION_WORKFLOW_ARN',
    );
    this.clientRegion =
      this.parseRegionFromArn(this.stateMachineArnDefault) ??
      this.parseRegionFromArn(this.deletionStateMachineArn) ??
      this.config.get<string>('AWS_REGION') ??
      process.env.AWS_REGION ??
      this.config.get<string>('AWS_DEFAULT_REGION') ??
      process.env.AWS_DEFAULT_REGION ??
      'eu-west-1';

    this.client = new SFNClient({ region: this.clientRegion });
  }

  async startAccountWorkflow(payload: AccountWorkflowInput) {
    try {
      const normalized = this.normalizePayload(payload);
      const stateMachineArn = this.resolveArnForType(normalized.type);
      if (!stateMachineArn) {
        this.logger.warn(
          `No state machine ARN configured for ${normalized.type}; skipping workflow start.`,
        );
        return;
      }
      this.logger.debug(
        `Starting account workflow for ${normalized.cognitoUsername ?? normalized.email ?? 'unknown user'} in ${this.clientRegion} using ARN ${stateMachineArn}`,
      );
      await this.client.send(
        new StartExecutionCommand({
          stateMachineArn,
          input: JSON.stringify(normalized),
        }),
      );
      this.logger.debug('Account workflow execution started successfully');
    } catch (error) {
      this.logger.error('Failed to start account workflow', error as Error);
    }
  }

  async startDeletionWorkflow(payload: AccountDeletionInput) {
    if (!this.deletionStateMachineArn) {
      this.logger.warn(
        'ACCOUNT_DELETION_WORKFLOW_ARN is not configured; skipping deletion workflow start.',
      );
      return;
    }

    try {
      const normalized = this.normalizeDeletionPayload(payload);
      this.logger.debug(
        `Starting account deletion workflow for ${normalized.cognitoUsername ?? normalized.profileId}`,
      );
      await this.client.send(
        new StartExecutionCommand({
          stateMachineArn: this.deletionStateMachineArn,
          input: JSON.stringify(normalized),
        }),
      );
      this.logger.debug(
        'Account deletion workflow execution started successfully',
      );
    } catch (error) {
      this.logger.error(
        'Failed to start account deletion workflow',
        error as Error,
      );
    }
  }

  private resolveArnForType(type: AccountType) {
    switch (type) {
      case 'civil-servant':
        return this.stateMachineArnCivil;
      case 'customer':
        return this.stateMachineArnCustomer;
      case 'administrator':
        return this.stateMachineArnAdmin;
      default:
        return this.stateMachineArnDefault;
    }
  }

  private normalizePayload(payload: AccountWorkflowInput) {
    const profile = payload.profile ?? {};
    const cognito = payload.cognitoUser ?? {};

    const firstName =
      payload.firstName ??
      profile.firstName ??
      (cognito as any).given_name ??
      (cognito as any).firstName;
    const familyName =
      payload.familyName ??
      profile.familyName ??
      (cognito as any).family_name ??
      (cognito as any).familyName;

    const cognitoUsername =
      payload.cognitoUsername ??
      profile.cognitoUsername ??
      cognito.username ??
      (cognito as any).userName ??
      undefined;

    const cognitoSub =
      payload.cognitoSub ??
      profile.cognitoSub ??
      profile.customerId ??
      profile.civilServantId ??
      cognito.sub;

    const profileId =
      payload.profileId?.trim() ??
      profile.civilServantId ??
      profile.customerId ??
      undefined;

    const profileAlreadyExists = false;

    return {
      type: payload.type,
      profileId,
      firstName,
      familyName,
      email: payload.email ?? profile.email ?? cognito.email,
      phoneNumber: payload.phoneNumber ?? profile.phoneNumber,
      address: payload.address ?? profile.address,
      occupation: payload.occupation ?? profile.occupation,
      otherOccupation: payload.otherOccupation ?? profile.otherOccupation,
      password: payload.password ?? profile.password,
      cognitoUsername,
      cognitoSub,
      eclipseCustomerId:
        payload.eclipseCustomerId ?? profile.eclipseCustomerId ?? undefined,
      eclipseWalletId:
        payload.eclipseWalletId ?? profile.eclipseWalletId ?? undefined,
      profileAlreadyExists,
    };
  }

  private parseRegionFromArn(arn?: string) {
    if (!arn) {
      return undefined;
    }
    const parts = arn.split(':');
    if (parts.length < 4) {
      return undefined;
    }
    return parts[3] || undefined;
  }

  private normalizeDeletionPayload(payload: AccountDeletionInput) {
    const profileId = payload.profileId?.trim();
    if (!profileId) {
      throw new Error('profileId is required to start deletion workflow');
    }

    return {
      type: payload.type,
      profileId,
      cognitoUsername: payload.cognitoUsername,
      eclipseCustomerId: payload.eclipseCustomerId,
      eclipseWalletId: payload.eclipseWalletId,
      step: 'deleteCognitoUser',
    };
  }
}
