import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignupDto, SignupRole } from './dto/signup.dto';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AccountWorkflowService } from '../workflows/account-workflow.service';

@Injectable()
export class SignupService {
  private readonly sns: SNSClient;
  private readonly signupTopicArn?: string;
  private readonly snsRegion: string;
  private readonly region: string;
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly workflows: AccountWorkflowService,
  ) {
    this.region =
      this.config.get<string>('AWS_REGION') ??
      this.config.get<string>('AWS_DEFAULT_REGION') ??
      'eu-west-1';

    this.signupTopicArn = this.config.get<string>('SIGNUP_SNS_TOPIC_ARN');
    this.snsRegion =
      this.resolveRegionFromArn(this.signupTopicArn) ?? this.region;

    if (this.signupTopicArn && this.snsRegion !== this.region) {
      this.logger.debug(
        `Using SNS region ${this.snsRegion} derived from topic ARN (service region is ${this.region})`,
      );
    }

    this.sns = new SNSClient({ region: this.snsRegion });
  }

  async signup(dto: SignupDto) {
    const accountType =
      dto.role === SignupRole.CUSTOMER ? 'customer' : 'civil-servant';

    try {
      await this.workflows.startAccountWorkflow({
        type: accountType,
        profileAlreadyExists: false,
        firstName: dto.firstName,
        familyName: dto.familyName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        occupation: dto.occupation,
        otherOccupation: dto.otherOccupation,
        password: dto.password,
      });
    } catch (error) {
      this.logger.error('Failed to start account workflow', error as Error);
      throw new InternalServerErrorException('Unable to queue signup');
    }

    if (this.signupTopicArn) {
      try {
        await this.sns.send(
          new PublishCommand({
            TopicArn: this.signupTopicArn,
            Subject: `New ${accountType} signup`,
            Message: `New ${accountType} signup queued: ${dto.firstName} ${dto.familyName} (${dto.email})`,
          }),
        );
      } catch (err) {
        this.logger.error(
          'Failed to publish signup notification',
          err as Error,
        );
        // do not fail the signup if notification fails
      }
    }

    return { status: 'queued' };
  }

  private resolveRegionFromArn(arn?: string): string | undefined {
    if (!arn) {
      return undefined;
    }

    const parts = arn.split(':');
    if (parts.length < 4) {
      return undefined;
    }

    const region = parts[3];
    return region || undefined;
  }
}
