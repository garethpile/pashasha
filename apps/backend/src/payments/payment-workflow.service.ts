import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SFNClient, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';

export interface CustomerPaymentInput {
  amount: number;
  currency?: string;
  destinationWalletId: string | number;
  customerId?: string;
  civilServantId?: string;
  guardToken?: string;
  accountNumber?: string;
  yourReference?: string;
  theirReference?: string;
  externalUniqueId?: string;
}

@Injectable()
export class PaymentWorkflowService {
  private readonly logger = new Logger(PaymentWorkflowService.name);
  private readonly arn?: string;
  private readonly client: SFNClient;

  constructor(private readonly config: ConfigService) {
    this.arn =
      process.env.CUSTOMER_PAYMENT_SFN_ARN ??
      this.config.get<string>('CUSTOMER_PAYMENT_SFN_ARN');
    this.client = new SFNClient({});
  }

  async startCustomerPayment(input: CustomerPaymentInput): Promise<any> {
    if (!this.arn) {
      throw new Error('Customer payment state machine not configured');
    }
    const resp = await this.client.send(
      new StartSyncExecutionCommand({
        stateMachineArn: this.arn,
        input: JSON.stringify(input),
      }),
    );
    if (resp.status !== 'SUCCEEDED') {
      throw new Error(`Payment workflow failed: ${resp.status ?? 'unknown'}`);
    }
    const output = resp.output ? JSON.parse(resp.output) : {};
    return output;
  }
}
