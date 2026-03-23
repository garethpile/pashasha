import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface PashashaPayFlashBackendStackProps extends cdk.StackProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly voucherApiBaseUrl?: string;
  readonly guardPortalBaseUrl?: string;
  readonly customersTableName?: string;
  readonly civilServantsTableName?: string;
  readonly administratorsTableName?: string;
  readonly paymentsTableName?: string;
  readonly supportTableName?: string;
  readonly counterTableName?: string;
  readonly userAssetsBucketName?: string;
  readonly kycAssetsBucketName?: string;
  readonly qrAssetsBucketName?: string;
}

export class PashashaPayFlashBackendStack extends cdk.Stack {
  public readonly apiEndpoint: string;
  public readonly frontendSecretsArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayFlashBackendStackProps) {
    super(scope, id, props);

    const customersTable = dynamodb.Table.fromTableName(
      this,
      'CustomersTable',
      props.customersTableName ?? 'PashashaPay-Customers'
    );
    const civilServantsTable = dynamodb.Table.fromTableName(
      this,
      'CivilServantsTable',
      props.civilServantsTableName ?? 'PashashaPay-Civil-servants'
    );
    const administratorsTable = dynamodb.Table.fromTableName(
      this,
      'AdministratorsTable',
      props.administratorsTableName ?? 'PashashaPay-Administrators'
    );
    const paymentsTable = dynamodb.Table.fromTableName(
      this,
      'PaymentsTable',
      props.paymentsTableName ?? 'PashashaPay-Payments'
    );
    const supportTable = dynamodb.Table.fromTableName(
      this,
      'SupportTable',
      props.supportTableName ?? 'PashashaPay-Support'
    );
    const counterTable = dynamodb.Table.fromTableName(
      this,
      'CounterTable',
      props.counterTableName ?? 'PashashaPay-Account-counters'
    );

    const userAssetsBucket = s3.Bucket.fromBucketName(
      this,
      'UserAssetsBucket',
      props.userAssetsBucketName ?? 'pashashapay-user-assets'
    );
    const kycAssetsBucket = s3.Bucket.fromBucketName(
      this,
      'KycAssetsBucket',
      props.kycAssetsBucketName ?? 'pashashapay-kyc-assets'
    );
    const qrAssetsBucket = s3.Bucket.fromBucketName(
      this,
      'QrAssetsBucket',
      props.qrAssetsBucketName ?? 'pashashapay-qr-assets'
    );

    const supportTopic = new sns.Topic(this, 'FlashSupportTopic', {
      topicName: 'PashashaPay-FlashSupport',
      displayName: 'Pashasha Flash Support',
    });

    const signupTopic = new sns.Topic(this, 'FlashSignupTopic', {
      topicName: 'PashashaPay-FlashSignup',
      displayName: 'Pashasha Flash Signup',
    });

    const workflowLogGroup = new logs.LogGroup(this, 'FlashAccountWorkflowLogs', {
      logGroupName: '/pashashapay/flash-account-workflow',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workflowFunction = new lambdaNode.NodejsFunction(this, 'FlashAccountWorkflowLambda', {
      entry: path.join(__dirname, '../../lambda/account-workflow/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_POOL_ID: props.userPoolId,
        CUSTOMERS_TABLE_NAME: customersTable.tableName,
        CIVIL_SERVANTS_TABLE_NAME: civilServantsTable.tableName,
        ECLIPSE_SECRET_ARN: '',
        SIGNUP_TOPIC_ARN: signupTopic.topicArn,
        COUNTER_TABLE_NAME: counterTable.tableName,
        USER_ASSETS_BUCKET: userAssetsBucket.bucketName,
        GUARD_PORTAL_BASE_URL: props.guardPortalBaseUrl ?? 'https://dev.pashasha.com',
        DISABLE_ECLIPSE: 'true',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });

    workflowFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminSetUserPassword',
        ],
        resources: ['*'],
      })
    );
    customersTable.grantReadWriteData(workflowFunction);
    civilServantsTable.grantReadWriteData(workflowFunction);
    counterTable.grantReadWriteData(workflowFunction);
    signupTopic.grantPublish(workflowFunction);
    userAssetsBucket.grantPut(workflowFunction);

    const createCognito = new sfnTasks.LambdaInvoke(this, 'FlashCreateCognitoUser', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createCognito',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const createProfile = new sfnTasks.LambdaInvoke(this, 'FlashCreateProfileRecord', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createProfile',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const ensureGuardAssets = new sfnTasks.LambdaInvoke(this, 'FlashEnsureGuardAssets', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'ensureGuardAssets',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const updateProfile = new sfnTasks.LambdaInvoke(this, 'FlashUpdateProfile', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'updateProfile',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });

    const definition = createCognito
      .next(createProfile)
      .next(ensureGuardAssets)
      .next(updateProfile);

    const accountWorkflow = new sfn.StateMachine(this, 'FlashAccountWorkflow', {
      definition,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
      timeout: cdk.Duration.minutes(10),
    });

    const handler = new lambdaNode.NodejsFunction(this, 'FlashBackendHandler', {
      entry: path.join(__dirname, '../../../apps/flash-backend/src/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        CUSTOMERS_TABLE_NAME: customersTable.tableName,
        CIVIL_SERVANTS_TABLE_NAME: civilServantsTable.tableName,
        ADMINISTRATORS_TABLE_NAME: administratorsTable.tableName,
        PAYMENTS_TABLE_NAME: paymentsTable.tableName,
        SUPPORT_TABLE_NAME: supportTable.tableName,
        COUNTER_TABLE_NAME: counterTable.tableName,
        USER_ASSETS_BUCKET: userAssetsBucket.bucketName,
        KYC_ASSETS_BUCKET: kycAssetsBucket.bucketName,
        QR_ASSETS_BUCKET: qrAssetsBucket.bucketName,
        SUPPORT_TOPIC_ARN: supportTopic.topicArn,
        VOUCHER_API_BASE_URL: props.voucherApiBaseUrl ?? '',
        GUARD_PORTAL_BASE_URL: props.guardPortalBaseUrl ?? 'https://dev.pashasha.com',
        USER_POOL_ID: props.userPoolId,
        ACCOUNT_WORKFLOW_ARN: accountWorkflow.stateMachineArn,
        ADMIN_WORKFLOW_ARN: accountWorkflow.stateMachineArn,
        OZOW_SECRET_ARN: 'pashashapay-ozow',
        OZOW_PAYMENT_URL: 'https://pay.ozow.com',
        OZOW_COUNTRY_CODE: 'ZA',
        OZOW_CURRENCY_CODE: 'ZAR',
        OZOW_SUCCESS_URL: 'https://example.com/ozow/success',
        OZOW_CANCEL_URL: 'https://example.com/ozow/cancel',
        OZOW_ERROR_URL: 'https://example.com/ozow/error',
        OZOW_NOTIFY_URL: 'https://example.com/ozow/notify',
        OZOW_IS_TEST: 'true',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });

    customersTable.grantReadWriteData(handler);
    civilServantsTable.grantReadWriteData(handler);
    administratorsTable.grantReadWriteData(handler);
    paymentsTable.grantReadWriteData(handler);
    supportTable.grantReadWriteData(handler);
    counterTable.grantReadWriteData(handler);
    userAssetsBucket.grantReadWrite(handler);
    kycAssetsBucket.grantReadWrite(handler);
    qrAssetsBucket.grantReadWrite(handler);
    supportTopic.grantPublish(handler);
    accountWorkflow.grantStartExecution(handler);
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['arn:aws:secretsmanager:eu-west-1:701158128147:secret:pashashapay-ozow*'],
      })
    );
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminDeleteUser',
        ],
        resources: ['*'],
      })
    );
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query'],
        resources: [
          `${paymentsTable.tableArn}/index/byCivilServant`,
          `${paymentsTable.tableArn}/index/byCustomer`,
          `${civilServantsTable.tableArn}/index/familyNameUpper`,
          `${civilServantsTable.tableArn}/index/accountNumber`,
          `${civilServantsTable.tableArn}/index/guardToken`,
          `${customersTable.tableArn}/index/familyNameUpper`,
          `${customersTable.tableArn}/index/accountNumber`,
          `${civilServantsTable.tableArn}/index/email`,
          `${customersTable.tableArn}/index/email`,
          `${administratorsTable.tableArn}/index/email`,
          `${supportTable.tableArn}/index/byCustomer`,
        ],
      })
    );

    const api = new apigwv2.HttpApi(this, 'FlashHttpApi', {
      apiName: 'PashashaPay-FlashApi',
      createDefaultStage: false,
      corsPreflight: {
        allowCredentials: true,
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: [
          'https://master.d28mxe1buxl9n7.amplifyapp.com',
          'https://dev.pashasha.com',
          'https://www.dev.pashasha.com',
        ],
      },
    });
    const stage = new apigwv2.HttpStage(this, 'FlashHttpStage', {
      httpApi: api,
      stageName: 'v1',
      autoDeploy: true,
    });

    const flashApiBase = `${api.apiEndpoint}/${stage.stageName}`;
    const guardPortalBase = props.guardPortalBaseUrl ?? 'https://dev.pashasha.com';
    handler.addEnvironment('OZOW_NOTIFY_URL', `${flashApiBase}/webhooks/ozow`);
    handler.addEnvironment('OZOW_SUCCESS_URL', `${guardPortalBase}/g`);
    handler.addEnvironment('OZOW_CANCEL_URL', `${guardPortalBase}/g`);
    handler.addEnvironment('OZOW_ERROR_URL', `${guardPortalBase}/g`);

    const integration = new apigwv2Integrations.HttpLambdaIntegration(
      'FlashBackendIntegration',
      handler
    );
    api.addRoutes({ path: '/', methods: [apigwv2.HttpMethod.ANY], integration });
    api.addRoutes({ path: '/{proxy+}', methods: [apigwv2.HttpMethod.ANY], integration });

    this.apiEndpoint = stage.url;

    const frontendSecrets = new cdk.aws_secretsmanager.Secret(this, 'FlashFrontendSecrets', {
      secretName: 'pashashapay-frontend-flash-config',
      description: 'Frontend config for Flash backend',
      secretObjectValue: {
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: cdk.SecretValue.unsafePlainText(props.userPoolId),
        NEXT_PUBLIC_COGNITO_CLIENT_ID: cdk.SecretValue.unsafePlainText(props.userPoolClientId),
        NEXT_PUBLIC_API_BASE_URL: cdk.SecretValue.unsafePlainText(this.apiEndpoint),
        NEXT_PUBLIC_BACKEND_API_ROOT: cdk.SecretValue.unsafePlainText(this.apiEndpoint),
      },
    });

    frontendSecrets.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        principals: [new iam.StarPrincipal()],
        conditions: {
          ArnLike: {
            'aws:PrincipalArn': [
              `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/*Amplify*`,
              `arn:aws:sts::${cdk.Aws.ACCOUNT_ID}:assumed-role/*Amplify*/*`,
            ],
          },
        },
        resources: [frontendSecrets.secretArn],
      })
    );

    this.frontendSecretsArn = frontendSecrets.secretArn;

    new cdk.CfnOutput(this, 'FlashApiEndpoint', { value: this.apiEndpoint });
    new cdk.CfnOutput(this, 'FlashFrontendSecretArn', { value: this.frontendSecretsArn });
    new cdk.CfnOutput(this, 'FlashAccountWorkflowArn', {
      value: accountWorkflow.stateMachineArn,
    });
  }
}
