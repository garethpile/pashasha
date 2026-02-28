import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface PashashaPayVoucherStackProps extends cdk.StackProps {
  flashApiBaseUrl?: string;
  flashSecretsArn?: string;
}

export class PashashaPayVoucherStack extends cdk.Stack {
  readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: PashashaPayVoucherStackProps) {
    super(scope, id, props);

    const handlersRoot = path.join(__dirname, '../../../apps/voucher-service/src/handlers');

    const payoutsTable = new dynamodb.Table(this, 'VoucherPayoutsTable', {
      partitionKey: { name: 'payoutId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAtEpoch',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const recipientsTable = new dynamodb.Table(this, 'VoucherRecipientsTable', {
      partitionKey: { name: 'recipientId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const eventsTable = new dynamodb.Table(this, 'VoucherEventsTable', {
      partitionKey: { name: 'payoutId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttlEpoch',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ledgerTable = new dynamodb.Table(this, 'VoucherLedgerTable', {
      partitionKey: { name: 'recipientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    payoutsTable.addGlobalSecondaryIndex({
      indexName: 'recipientId-index',
      partitionKey: { name: 'recipientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const environment = {
      PAYOUTS_TABLE_NAME: payoutsTable.tableName,
      RECIPIENTS_TABLE_NAME: recipientsTable.tableName,
      EVENTS_TABLE_NAME: eventsTable.tableName,
      LEDGER_TABLE_NAME: ledgerTable.tableName,
      FLASH_BASE_URL: props.flashApiBaseUrl ?? 'https://api-flashswitch-sandbox.flash-group.com',
      FLASH_TOKEN_URL: 'https://api-flashswitch-sandbox.flash-group.com/token',
      FLASH_ACCOUNT_NUMBER: '',
      FLASH_CASH_OUT_PRODUCT_CODE: '',
      FLASH_TOKEN_PRODUCT_CODE: '',
      FLASH_SECRETS_ARN: props.flashSecretsArn ?? '',
      FLASH_WEBHOOK_SIGNATURE_HEADER: 'x-flash-signature',
      FLASH_USE_MOCK: props.flashSecretsArn ? 'false' : 'true',
    };

    const createPayoutFn = new lambdaNodejs.NodejsFunction(this, 'VoucherCreatePayoutFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'createPayout.ts'),
      handler: 'handler',
      environment,
    });

    const getPayoutFn = new lambdaNodejs.NodejsFunction(this, 'VoucherGetPayoutFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getPayout.ts'),
      handler: 'handler',
      environment,
    });

    const webhookFn = new lambdaNodejs.NodejsFunction(this, 'VoucherWebhookFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'webhookHandler.ts'),
      handler: 'handler',
      environment,
    });

    const listRecipientPayoutsFn = new lambdaNodejs.NodejsFunction(
      this,
      'VoucherListRecipientPayoutsFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'listRecipientPayouts.ts'),
        handler: 'handler',
        environment,
      }
    );

    const recordCreditFn = new lambdaNodejs.NodejsFunction(this, 'VoucherRecordCreditFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'recordCredit.ts'),
      handler: 'handler',
      environment,
    });

    const getBalanceFn = new lambdaNodejs.NodejsFunction(this, 'VoucherGetBalanceFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getBalance.ts'),
      handler: 'handler',
      environment,
    });

    const issueVoucherFn = new lambdaNodejs.NodejsFunction(this, 'VoucherIssueFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'issueVoucher.ts'),
      handler: 'handler',
      environment,
      timeout: cdk.Duration.seconds(30),
    });

    const notifyFn = new lambdaNodejs.NodejsFunction(this, 'VoucherNotifyFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'notifyRecipient.ts'),
      handler: 'handler',
      environment,
    });

    const markFailedFn = new lambdaNodejs.NodejsFunction(this, 'VoucherMarkFailedFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'markFailed.ts'),
      handler: 'handler',
      environment,
    });

    const issueTask = new tasks.LambdaInvoke(this, 'IssueVoucher', {
      lambdaFunction: issueVoucherFn,
      outputPath: '$.Payload',
    });

    const notifyTask = new tasks.LambdaInvoke(this, 'NotifyRecipient', {
      lambdaFunction: notifyFn,
      outputPath: '$.Payload',
    });

    const markFailedTask = new tasks.LambdaInvoke(this, 'MarkFailed', {
      lambdaFunction: markFailedFn,
      outputPath: '$.Payload',
    });

    const definition = issueTask
      .addCatch(markFailedTask, {
        errors: ['States.ALL'],
      })
      .next(notifyTask);

    const stateMachine = new sfn.StateMachine(this, 'VoucherStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5),
    });

    createPayoutFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);

    stateMachine.grantStartExecution(createPayoutFn);

    payoutsTable.grantReadWriteData(createPayoutFn);
    payoutsTable.grantReadWriteData(issueVoucherFn);
    payoutsTable.grantReadWriteData(webhookFn);
    payoutsTable.grantReadData(getPayoutFn);
    payoutsTable.grantReadData(listRecipientPayoutsFn);
    payoutsTable.grantReadWriteData(markFailedFn);
    payoutsTable.grantReadData(getBalanceFn);

    recipientsTable.grantReadWriteData(createPayoutFn);
    recipientsTable.grantReadWriteData(issueVoucherFn);
    recipientsTable.grantReadWriteData(webhookFn);
    recipientsTable.grantReadWriteData(recordCreditFn);
    recipientsTable.grantReadData(getBalanceFn);

    eventsTable.grantReadWriteData(webhookFn);
    eventsTable.grantReadWriteData(createPayoutFn);

    ledgerTable.grantReadWriteData(recordCreditFn);
    ledgerTable.grantReadWriteData(createPayoutFn);

    if (props.flashSecretsArn) {
      const secret = cdk.aws_secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'FlashSecrets',
        props.flashSecretsArn
      );
      secret.grantRead(createPayoutFn);
      secret.grantRead(issueVoucherFn);
      secret.grantRead(webhookFn);
      secret.grantRead(markFailedFn);
    }

    const api = new apigateway.RestApi(this, 'VoucherApi', {
      restApiName: 'PashashaPayVoucherApi',
      deployOptions: { stageName: 'v1' },
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'https://master.d28mxe1buxl9n7.amplifyapp.com',
          'https://dev.pashasha.com',
          'https://www.dev.pashasha.com',
        ],
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
      },
    });

    const payouts = api.root.addResource('payouts');
    payouts.addMethod('POST', new apigateway.LambdaIntegration(createPayoutFn));

    const credits = api.root.addResource('credits');
    credits.addMethod('POST', new apigateway.LambdaIntegration(recordCreditFn));

    const payoutById = payouts.addResource('{payoutId}');
    payoutById.addMethod('GET', new apigateway.LambdaIntegration(getPayoutFn));

    const recipients = api.root.addResource('recipients');
    const recipientById = recipients.addResource('{recipientId}');
    const recipientBalance = recipientById.addResource('balance');
    recipientBalance.addMethod('GET', new apigateway.LambdaIntegration(getBalanceFn));
    const recipientPayouts = recipientById.addResource('payouts');
    recipientPayouts.addMethod('GET', new apigateway.LambdaIntegration(listRecipientPayoutsFn));

    const webhooks = api.root.addResource('webhooks');
    const flash = webhooks.addResource('flash');
    flash.addMethod('POST', new apigateway.LambdaIntegration(webhookFn));

    this.apiUrl = api.url ?? '';

    new cdk.CfnOutput(this, 'VoucherApiUrl', {
      value: this.apiUrl,
    });
  }
}
