import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface PashashaPayNotificationsStackProps extends cdk.StackProps {}

export class PashashaPayNotificationsStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly smsProviderSecretArn: string;
  public readonly coreApiKeySecretArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayNotificationsStackProps = {}) {
    super(scope, id, props);

    const notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: 'PashashaPay-Notifications',
      partitionKey: { name: 'notificationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    notificationsTable.addGlobalSecondaryIndex({
      indexName: 'byRecipient',
      partitionKey: { name: 'recipient', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const smsProviderSecret = new secretsmanager.Secret(this, 'SmsProviderSecret', {
      secretName: 'pashasha/notifications/sms',
      description: 'SMS provider credentials for voucher delivery and future notifications',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          provider: 'aws-sns',
          senderId: 'Pashasha',
          smsType: 'Transactional',
          maxPrice: '1.00',
        }),
        generateStringKey: 'bootstrap',
      },
    });

    const coreApiKeySecret = new secretsmanager.Secret(this, 'NotificationsCoreApiKeySecret', {
      secretName: 'pashasha/notifications/core-api-key',
      description: 'Shared API key used by core-backend to call notifications internal routes',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });

    const handlersRoot = path.join(__dirname, '../../../apps/notifications/src/handlers');
    const sendNotificationFn = new lambdaNodejs.NodejsFunction(this, 'SendNotificationFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'sendNotification.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: {
        NOTIFICATIONS_TABLE_NAME: notificationsTable.tableName,
        NOTIFICATIONS_CORE_API_KEY_SECRET_ARN: coreApiKeySecret.secretArn,
        SMS_PROVIDER_SECRET_ARN: smsProviderSecret.secretArn,
      },
    });

    const api = new apigwv2.HttpApi(this, 'NotificationsHttpApi', {
      apiName: 'PashashaPay-NotificationsApi',
      description: 'Greenfield MVP notifications boundary',
      createDefaultStage: true,
    });

    api.addRoutes({
      path: '/internal/notifications/send',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'SendNotificationIntegration',
        sendNotificationFn
      ),
    });

    notificationsTable.grantReadWriteData(sendNotificationFn);
    coreApiKeySecret.grantRead(sendNotificationFn);
    smsProviderSecret.grantRead(sendNotificationFn);
    sendNotificationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: ['*'],
      })
    );

    this.apiUrl = api.apiEndpoint;
    this.smsProviderSecretArn = smsProviderSecret.secretArn;
    this.coreApiKeySecretArn = coreApiKeySecret.secretArn;

    new cdk.CfnOutput(this, 'NotificationsApiUrl', {
      value: this.apiUrl,
    });
    new cdk.CfnOutput(this, 'SmsProviderSecretArn', {
      value: this.smsProviderSecretArn,
    });
    new cdk.CfnOutput(this, 'NotificationsCoreApiKeySecretArn', {
      value: this.coreApiKeySecretArn,
    });
    new cdk.CfnOutput(this, 'NotificationsTableName', {
      value: notificationsTable.tableName,
    });
  }
}
