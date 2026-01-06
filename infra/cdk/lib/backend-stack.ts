import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface PashashaPayBackendStackProps extends cdk.StackProps {
  /**
   * Optional path to the directory (`docker build` context) that should be used for the backend container.
   * Defaults to the repository root (../../.. relative to this file).
   */
  readonly dockerBuildPath?: string;

  /**
   * Optional path to the Dockerfile relative to `dockerBuildPath`.
   * Defaults to `apps/backend/Dockerfile` when `dockerBuildPath` points at the repository root.
   */
  readonly dockerFilePath?: string;
}

export class PashashaPayBackendStack extends cdk.Stack {
  public readonly backendService: ecs.FargateService;
  public readonly backendListener: elbv2.ApplicationListener;
  public readonly loadBalancerDnsName: string;
  public readonly apiEndpoint: string;
  public readonly secureApiEndpoint: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly frontendSecretsArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayBackendStackProps = {}) {
    super(scope, id, props);

    const cognitoSmsRole = new iam.Role(this, 'CognitoSmsRole', {
      assumedBy: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
      description: 'Allows Cognito to publish SMS messages via SNS',
      inlinePolicies: {
        CognitoSmsPublish: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sns:Publish'],
              resources: ['*'],
            }),
          ],
        }),
      },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonSNSRole')],
    });

    const vpc = new ec2.Vpc(this, 'BackendVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, 'BackendCluster', {
      vpc,
      containerInsights: true,
      clusterName: 'PashashaPay-BackendCluster',
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
        phone: true,
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      smsRole: cognitoSmsRole,
      smsRoleExternalId: 'CognitoSmsRoleExternal',
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        email: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
      },
      userPoolName: 'PashashaPay-UserPool',
    });

    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      userPoolClientName: 'PashashaPay-WebClient',
    });

    new cognito.CfnUserPoolGroup(this, 'AdministratorsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Administrators',
    });
    new cognito.CfnUserPoolGroup(this, 'CustomersGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Customers',
    });
    new cognito.CfnUserPoolGroup(this, 'CivilServantsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'CivilServants',
    });

    const customersTable = new dynamodb.Table(this, 'CustomersTable', {
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Customers',
    });
    customersTable.addGlobalSecondaryIndex({
      indexName: 'accountNumber',
      partitionKey: { name: 'accountNumber', type: dynamodb.AttributeType.STRING },
    });
    customersTable.addGlobalSecondaryIndex({
      indexName: 'familyNameUpper',
      partitionKey: { name: 'familyNameUpper', type: dynamodb.AttributeType.STRING },
    });
    customersTable.addGlobalSecondaryIndex({
      indexName: 'email',
      partitionKey: { name: 'emailLower', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const civilServantsTable = new dynamodb.Table(this, 'CivilServantsTable', {
      partitionKey: { name: 'civilServantId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Civil-servants',
    });
    civilServantsTable.addGlobalSecondaryIndex({
      indexName: 'accountNumber',
      partitionKey: { name: 'accountNumber', type: dynamodb.AttributeType.STRING },
    });
    civilServantsTable.addGlobalSecondaryIndex({
      indexName: 'familyNameUpper',
      partitionKey: { name: 'familyNameUpper', type: dynamodb.AttributeType.STRING },
    });
    civilServantsTable.addGlobalSecondaryIndex({
      indexName: 'guardToken',
      partitionKey: { name: 'guardToken', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    civilServantsTable.addGlobalSecondaryIndex({
      indexName: 'email',
      partitionKey: { name: 'emailLower', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const administratorsTable = new dynamodb.Table(this, 'AdministratorsTable', {
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Administrators',
    });
    administratorsTable.addGlobalSecondaryIndex({
      indexName: 'email',
      partitionKey: { name: 'emailLower', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const paymentsTable = new dynamodb.Table(this, 'PaymentsTable', {
      partitionKey: { name: 'paymentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Payments',
    });
    paymentsTable.addGlobalSecondaryIndex({
      indexName: 'byCustomer',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
    });
    paymentsTable.addGlobalSecondaryIndex({
      indexName: 'byCivilServant',
      partitionKey: { name: 'civilServantId', type: dynamodb.AttributeType.STRING },
    });
    paymentsTable.addGlobalSecondaryIndex({
      indexName: 'byWallet',
      partitionKey: { name: 'walletId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const accountCounterTable = new dynamodb.Table(this, 'AccountCounterTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Account-counters',
    });

    const supportTicketsTable = new dynamodb.Table(this, 'SupportTicketsTable', {
      partitionKey: { name: 'supportCode', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-Support',
    });
    supportTicketsTable.addGlobalSecondaryIndex({
      indexName: 'byCustomer',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'supportCode', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const auditLogsTable = new dynamodb.Table(this, 'AuditLogsTable', {
      partitionKey: { name: 'auditId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'PashashaPay-AuditLogs',
    });
    auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'eventType-index',
      partitionKey: { name: 'eventType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const userAssetsBucket = new s3.Bucket(this, 'UserAssetsBucket', {
      bucketName: 'pashashapay-user-assets',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const kycAssetsBucket = new s3.Bucket(this, 'KycAssetsBucket', {
      bucketName: 'pashashapay-kyc-assets',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const qrAssetsBucket = new s3.Bucket(this, 'QrAssetsBucket', {
      bucketName: 'pashashapay-qr-assets',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const logGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: '/pashashapay/backend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workflowLogGroup = new logs.LogGroup(this, 'AccountWorkflowLogs', {
      logGroupName: '/pashashapay/account-workflow',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Eclipse sandbox secret (contains ECLIPSE_API_BASE, ECLIPSE_TENANT_ID, etc.)
    const eclipseSecretArn =
      process.env.ECLIPSE_SECRET_ARN ?? this.node.tryGetContext('ECLIPSE_SECRET_ARN');

    const eclipseSecret =
      eclipseSecretArn && eclipseSecretArn.length > 0
        ? secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'EclipseSandboxSecret',
            eclipseSecretArn
          )
        : new secretsmanager.Secret(this, 'EclipseSandboxSecret', {
            secretName: 'pashashapay/eclipse',
            description: 'Eclipse sandbox credentials for PashashaPay',
            secretObjectValue: {
              ECLIPSE_API_BASE: cdk.SecretValue.unsafePlainText(
                'https://eclipse-java-sandbox.ukheshe.rocks'
              ),
              ECLIPSE_TENANT_ID: cdk.SecretValue.unsafePlainText('placeholder-tenant-id'),
              ECLIPSE_CLIENT_ID: cdk.SecretValue.unsafePlainText('placeholder-client-id'),
              ECLIPSE_CLIENT_SECRET: cdk.SecretValue.unsafePlainText('placeholder-client-secret'),
              ECLIPSE_TENANT_IDENTITY: cdk.SecretValue.unsafePlainText(
                'placeholder-tenant-identity'
              ),
              ECLIPSE_TENANT_PASSWORD: cdk.SecretValue.unsafePlainText(
                'placeholder-tenant-password'
              ),
              ECLIPSE_CALLBACK_BASE: cdk.SecretValue.unsafePlainText('https://example.com'),
              ECLIPSE_WEBHOOK_SECRET: cdk.SecretValue.unsafePlainText('placeholder'),
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          });

    const signupTopic = new sns.Topic(this, 'SignupNotificationsTopic', {
      topicName: 'PashashaPay-AccountProvisioning',
      displayName: 'Pashasha Account Provisioning',
    });

    const paymentsTopic = new sns.Topic(this, 'PaymentsNotificationsTopic', {
      topicName: 'PashashaPay-Payments',
      displayName: 'Pashasha Payments',
    });

    const supportTopic = new sns.Topic(this, 'SupportNotificationsTopic', {
      topicName: 'PashashaPay-Support',
      displayName: 'Pashasha Support',
    });

    const customerPaymentLambda = new lambdaNode.NodejsFunction(this, 'CustomerPaymentLambda', {
      entry: path.join(__dirname, '../../lambda/customer-payment/handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: {
        PAYMENTS_TABLE_NAME: paymentsTable.tableName,
        PAYMENT_SUCCESS_SNS_TOPIC_ARN: paymentsTopic.topicArn,
        PAYMENT_FAILURE_SNS_TOPIC_ARN: paymentsTopic.topicArn,
        ECLIPSE_SECRET_ARN: eclipseSecret.secretArn,
        SUPPORT_TOPIC_ARN: supportTopic.topicArn,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });
    paymentsTable.grantReadWriteData(customerPaymentLambda);
    paymentsTopic.grantPublish(customerPaymentLambda);
    supportTopic.grantPublish(customerPaymentLambda);
    eclipseSecret.grantRead(customerPaymentLambda);

    const defaultGuardPortal = 'https://dev.pashasha.com';
    const guardPortalBaseUrl = process.env.GUARD_PORTAL_BASE_URL ?? defaultGuardPortal;

    const workflowFunction = new lambdaNode.NodejsFunction(this, 'AccountWorkflowLambda', {
      entry: path.join(__dirname, '../../lambda/account-workflow/handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CUSTOMERS_TABLE_NAME: customersTable.tableName,
        CIVIL_SERVANTS_TABLE_NAME: civilServantsTable.tableName,
        ECLIPSE_SECRET_ARN: eclipseSecret.secretArn,
        SIGNUP_TOPIC_ARN: signupTopic.topicArn,
        COUNTER_TABLE_NAME: accountCounterTable.tableName,
        USER_ASSETS_BUCKET: userAssetsBucket.bucketName,
        GUARD_PORTAL_BASE_URL: guardPortalBaseUrl,
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });

    userPool.grant(workflowFunction, 'cognito-idp:AdminCreateUser');
    userPool.grant(workflowFunction, 'cognito-idp:AdminAddUserToGroup');
    workflowFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminSetUserPassword'],
        resources: [userPool.userPoolArn],
      })
    );
    customersTable.grantReadWriteData(workflowFunction);
    civilServantsTable.grantReadWriteData(workflowFunction);
    accountCounterTable.grantReadWriteData(workflowFunction);
    eclipseSecret.grantRead(workflowFunction);
    signupTopic.grantPublish(workflowFunction);
    userAssetsBucket.grantPut(workflowFunction);

    const workflowNotifier = new lambdaNode.NodejsFunction(this, 'AccountWorkflowNotifier', {
      entry: path.join(__dirname, '../../lambda/account-workflow/notifier.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: {
        SIGNUP_TOPIC_ARN: signupTopic.topicArn,
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });
    signupTopic.grantPublish(workflowNotifier);

    const createCognito = new sfnTasks.LambdaInvoke(this, 'CreateCognitoUser', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createCognito',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const createProfile = new sfnTasks.LambdaInvoke(this, 'CreateProfileRecord', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createProfile',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const createEclipseCustomer = new sfnTasks.LambdaInvoke(this, 'CreateEclipseCustomer', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createEclipseCustomer',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const createEclipseWallet = new sfnTasks.LambdaInvoke(this, 'CreateEclipseWallet', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'createEclipseWallet',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const ensureGuardAssets = new sfnTasks.LambdaInvoke(this, 'EnsureGuardAssets', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'ensureGuardAssets',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });
    const updateProfile = new sfnTasks.LambdaInvoke(this, 'UpdateProfileWithEclipseIds', {
      lambdaFunction: workflowFunction,
      payload: sfn.TaskInput.fromObject({
        state: sfn.TaskInput.fromJsonPathAt('$'),
        step: 'updateProfile',
      }),
      payloadResponseOnly: true,
      resultPath: '$',
    });

    const buildWorkflowDefinition = (prefix: string, includeEclipse: boolean) => {
      const successState = new sfn.Succeed(this, `${prefix}AccountWorkflowSucceeded`);
      const notifySuccess = new sfnTasks.LambdaInvoke(this, `${prefix}NotifyWorkflowSuccess`, {
        lambdaFunction: workflowNotifier,
        payload: sfn.TaskInput.fromObject({
          status: 'success',
          message: sfn.JsonPath.format(
            'Account provisioning succeeded for {}',
            sfn.JsonPath.stringAt('$.type')
          ),
          context: sfn.TaskInput.fromObject({
            type: sfn.JsonPath.stringAt('$.type'),
            profileId: sfn.JsonPath.stringAt('$.profileId'),
            cognitoUsername: sfn.JsonPath.stringAt('$.cognitoUsername'),
            cognitoSub: sfn.JsonPath.stringAt('$.cognitoSub'),
            eclipseCustomerId: sfn.JsonPath.stringAt('$.eclipseCustomerId'),
            eclipseWalletId: sfn.JsonPath.stringAt('$.eclipseWalletId'),
          }),
        }),
        payloadResponseOnly: true,
        resultPath: '$.notification',
      });

      const notifyFailure = new sfnTasks.LambdaInvoke(this, `${prefix}NotifyWorkflowFailure`, {
        lambdaFunction: workflowNotifier,
        payload: sfn.TaskInput.fromObject({
          status: 'failure',
          message: sfn.JsonPath.stringAt('$.error.Cause'),
          context: sfn.TaskInput.fromJsonPathAt('$.error'),
        }),
        payloadResponseOnly: true,
        resultPath: '$.notification',
      });
      const failureState = new sfn.Fail(this, `${prefix}AccountWorkflowFailed`, {
        cause: 'Account provisioning failed',
      });
      const failureChain = notifyFailure.next(failureState);

      const withFailureHandling = <T extends sfn.TaskStateBase>(state: T) =>
        state.addCatch(failureChain, {
          resultPath: '$.error',
          errors: ['States.ALL'],
        });

      let chain = withFailureHandling(
        new sfnTasks.LambdaInvoke(this, `${prefix}CreateCognitoUser`, {
          lambdaFunction: workflowFunction,
          payload: sfn.TaskInput.fromObject({
            state: sfn.TaskInput.fromJsonPathAt('$'),
            step: 'createCognito',
          }),
          payloadResponseOnly: true,
          resultPath: '$',
        })
      ).next(
        withFailureHandling(
          new sfnTasks.LambdaInvoke(this, `${prefix}CreateProfileRecord`, {
            lambdaFunction: workflowFunction,
            payload: sfn.TaskInput.fromObject({
              state: sfn.TaskInput.fromJsonPathAt('$'),
              step: 'createProfile',
            }),
            payloadResponseOnly: true,
            resultPath: '$',
          })
        )
      );

      if (includeEclipse) {
        chain = chain
          .next(
            withFailureHandling(
              new sfnTasks.LambdaInvoke(this, `${prefix}CreateEclipseCustomer`, {
                lambdaFunction: workflowFunction,
                payload: sfn.TaskInput.fromObject({
                  state: sfn.TaskInput.fromJsonPathAt('$'),
                  step: 'createEclipseCustomer',
                }),
                payloadResponseOnly: true,
                resultPath: '$',
              })
            )
          )
          .next(
            withFailureHandling(
              new sfnTasks.LambdaInvoke(this, `${prefix}CreateEclipseWallet`, {
                lambdaFunction: workflowFunction,
                payload: sfn.TaskInput.fromObject({
                  state: sfn.TaskInput.fromJsonPathAt('$'),
                  step: 'createEclipseWallet',
                }),
                payloadResponseOnly: true,
                resultPath: '$',
              })
            )
          )
          .next(
            withFailureHandling(
              new sfnTasks.LambdaInvoke(this, `${prefix}EnsureGuardAssets`, {
                lambdaFunction: workflowFunction,
                payload: sfn.TaskInput.fromObject({
                  state: sfn.TaskInput.fromJsonPathAt('$'),
                  step: 'ensureGuardAssets',
                }),
                payloadResponseOnly: true,
                resultPath: '$',
              })
            )
          )
          .next(
            withFailureHandling(
              new sfnTasks.LambdaInvoke(this, `${prefix}UpdateProfileWithEclipseIds`, {
                lambdaFunction: workflowFunction,
                payload: sfn.TaskInput.fromObject({
                  state: sfn.TaskInput.fromJsonPathAt('$'),
                  step: 'updateProfile',
                }),
                payloadResponseOnly: true,
                resultPath: '$',
              })
            )
          );
      }

      return chain.next(notifySuccess).next(successState);
    };

    const civilDefinition = buildWorkflowDefinition('CivilServant', true);
    const customerDefinition = buildWorkflowDefinition('Customer', true);

    const adminDefinition = (() => {
      const successState = new sfn.Succeed(this, `AdministratorAccountWorkflowSucceeded`);
      const notifySuccess = new sfnTasks.LambdaInvoke(this, `AdministratorNotifyWorkflowSuccess`, {
        lambdaFunction: workflowNotifier,
        payload: sfn.TaskInput.fromObject({
          status: 'success',
          message: sfn.JsonPath.format(
            'Account provisioning succeeded for {}',
            sfn.JsonPath.stringAt('$.type')
          ),
          context: sfn.TaskInput.fromObject({
            type: sfn.JsonPath.stringAt('$.type'),
            profileId: sfn.JsonPath.stringAt('$.profileId'),
            cognitoUsername: sfn.JsonPath.stringAt('$.cognitoUsername'),
            cognitoSub: sfn.JsonPath.stringAt('$.cognitoSub'),
          }),
        }),
        payloadResponseOnly: true,
        resultPath: '$.notification',
      });
      const notifyFailure = new sfnTasks.LambdaInvoke(this, `AdministratorNotifyWorkflowFailure`, {
        lambdaFunction: workflowNotifier,
        payload: sfn.TaskInput.fromObject({
          status: 'failure',
          message: sfn.JsonPath.stringAt('$.error.Cause'),
          context: sfn.TaskInput.fromJsonPathAt('$.error'),
        }),
        payloadResponseOnly: true,
        resultPath: '$.notification',
      });
      const failureState = new sfn.Fail(this, `AdministratorAccountWorkflowFailed`, {
        cause: 'Account provisioning failed',
      });
      const failureChain = notifyFailure.next(failureState);
      const withFailureHandling = <T extends sfn.TaskStateBase>(state: T) =>
        state.addCatch(failureChain, {
          resultPath: '$.error',
          errors: ['States.ALL'],
        });

      return withFailureHandling(
        new sfnTasks.LambdaInvoke(this, `AdministratorCreateCognitoUser`, {
          lambdaFunction: workflowFunction,
          payload: sfn.TaskInput.fromObject({
            state: sfn.TaskInput.fromJsonPathAt('$'),
            step: 'createCognito',
          }),
          payloadResponseOnly: true,
          resultPath: '$',
        })
      )
        .next(
          withFailureHandling(
            new sfnTasks.LambdaInvoke(this, `AdministratorCreateProfileRecord`, {
              lambdaFunction: workflowFunction,
              payload: sfn.TaskInput.fromObject({
                state: sfn.TaskInput.fromJsonPathAt('$'),
                step: 'createProfile',
              }),
              payloadResponseOnly: true,
              resultPath: '$',
            })
          )
        )
        .next(notifySuccess)
        .next(successState);
    })();

    const accountWorkflowCivil = new sfn.StateMachine(this, 'AccountProvisioningCivilServant', {
      stateMachineName: 'PashashaPay-AccountProvisioning-CivilServant',
      definitionBody: sfn.DefinitionBody.fromChainable(civilDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    const accountWorkflowCustomer = new sfn.StateMachine(this, 'AccountProvisioningCustomer', {
      stateMachineName: 'PashashaPay-AccountProvisioning-Customer',
      definitionBody: sfn.DefinitionBody.fromChainable(customerDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    const accountWorkflowAdmin = new sfn.StateMachine(this, 'AccountProvisioningAdministrator', {
      stateMachineName: 'PashashaPay-AccountProvisioning-Administrator',
      definitionBody: sfn.DefinitionBody.fromChainable(adminDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    const customerPaymentStateMachine = new sfn.StateMachine(this, 'CustomerPaymentStateMachine', {
      stateMachineName: 'PashashaPay-CustomerPayment',
      definitionBody: sfn.DefinitionBody.fromChainable(
        new sfnTasks.LambdaInvoke(this, 'InvokeCustomerPayment', {
          lambdaFunction: customerPaymentLambda,
          payload: sfn.TaskInput.fromJsonPathAt('$'),
          payloadResponseOnly: true,
          resultPath: '$',
        })
      ),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
      stateMachineType: sfn.StateMachineType.EXPRESS,
    });

    // Publish key ARNs/IDs to SSM for runtime injection and external consumers.
    const signupTopicArnParam = new ssm.StringParameter(this, 'SignupTopicArnParam', {
      parameterName: '/pashashapay/topics/signup',
      stringValue: signupTopic.topicArn,
    });
    const paymentsTopicArnParam = new ssm.StringParameter(this, 'PaymentsTopicArnParam', {
      parameterName: '/pashashapay/topics/payments',
      stringValue: paymentsTopic.topicArn,
    });
    const supportTopicArnParam = new ssm.StringParameter(this, 'SupportTopicArnParam', {
      parameterName: '/pashashapay/topics/support',
      stringValue: supportTopic.topicArn,
    });
    const accountWorkflowCivilArnParam = new ssm.StringParameter(
      this,
      'AccountWorkflowCivilArnParam',
      {
        parameterName: '/pashashapay/workflows/account/civilServant',
        stringValue: accountWorkflowCivil.stateMachineArn,
      }
    );
    const accountWorkflowCustomerArnParam = new ssm.StringParameter(
      this,
      'AccountWorkflowCustomerArnParam',
      {
        parameterName: '/pashashapay/workflows/account/customer',
        stringValue: accountWorkflowCustomer.stateMachineArn,
      }
    );
    const accountWorkflowAdminArnParam = new ssm.StringParameter(
      this,
      'AccountWorkflowAdminArnParam',
      {
        parameterName: '/pashashapay/workflows/account/admin',
        stringValue: accountWorkflowAdmin.stateMachineArn,
      }
    );
    const customerPaymentStateMachineArnParam = new ssm.StringParameter(
      this,
      'CustomerPaymentStateMachineArnParam',
      {
        parameterName: '/pashashapay/workflows/customerPayment',
        stringValue: customerPaymentStateMachine.stateMachineArn,
      }
    );

    // Default Docker build context to the monorepo root (one level above infra/).
    // Anchor the Docker build context to the monorepo root so required workspace files
    // (package.json, package-lock.json, packages/*, etc.) are always available regardless
    // of where the CDK command is executed from.
    const buildPath = props.dockerBuildPath ?? path.resolve(__dirname, '..', '..', '..');
    const dockerFilePath = props.dockerFilePath ?? path.join('apps', 'backend', 'Dockerfile');

    const containerImage = ecs.ContainerImage.fromAsset(buildPath, {
      file: dockerFilePath,
      platform: ecrAssets.Platform.LINUX_AMD64,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'BackendFargateService',
      {
        cluster,
        cpu: 1024,
        memoryLimitMiB: 4096,
        desiredCount: 1,
        publicLoadBalancer: true,
        serviceName: 'Pashasha-BackendService',
        taskImageOptions: {
          image: containerImage,
          containerPort: 4000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'pashashapay-backend',
            logGroup,
          }),
          environment: {
            NODE_ENV: 'production',
            PORT: '4000',
            USER_POOL_ID: userPool.userPoolId,
            USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            CUSTOMERS_TABLE_NAME: customersTable.tableName,
            CIVIL_SERVANTS_TABLE_NAME: civilServantsTable.tableName,
            ADMINISTRATORS_TABLE_NAME: administratorsTable.tableName,
            PAYMENTS_TABLE_NAME: paymentsTable.tableName,
            USER_ASSETS_BUCKET: userAssetsBucket.bucketName,
            KYC_ASSETS_BUCKET: kycAssetsBucket.bucketName,
            QR_ASSETS_BUCKET: qrAssetsBucket.bucketName,
            COUNTER_TABLE_NAME: accountCounterTable.tableName,
            GUARD_PORTAL_BASE_URL: guardPortalBaseUrl,
            TENANT_WALLET_ID: process.env.TENANT_WALLET_ID ?? '',
            SUPPORT_TABLE_NAME: supportTicketsTable.tableName,
            AUDIT_TABLE_NAME: auditLogsTable.tableName,
          },
          secrets: {
            SIGNUP_SNS_TOPIC_ARN: ecs.Secret.fromSsmParameter(signupTopicArnParam),
            PAYMENTS_SNS_TOPIC_ARN: ecs.Secret.fromSsmParameter(paymentsTopicArnParam),
            SUPPORT_TOPIC_ARN: ecs.Secret.fromSsmParameter(supportTopicArnParam),
            ACCOUNT_WORKFLOW_ARN: ecs.Secret.fromSsmParameter(accountWorkflowCivilArnParam),
            ACCOUNT_WORKFLOW_ARN_CIVIL: ecs.Secret.fromSsmParameter(accountWorkflowCivilArnParam),
            ACCOUNT_WORKFLOW_ARN_CUSTOMER: ecs.Secret.fromSsmParameter(
              accountWorkflowCustomerArnParam
            ),
            ACCOUNT_WORKFLOW_ARN_ADMINISTRATOR: ecs.Secret.fromSsmParameter(
              accountWorkflowAdminArnParam
            ),
            CUSTOMER_PAYMENT_SFN_ARN: ecs.Secret.fromSsmParameter(
              customerPaymentStateMachineArnParam
            ),
            ECLIPSE_API_BASE: ecs.Secret.fromSecretsManager(eclipseSecret, 'ECLIPSE_API_BASE'),
            ECLIPSE_CLIENT_ID: ecs.Secret.fromSecretsManager(eclipseSecret, 'ECLIPSE_CLIENT_ID'),
            ECLIPSE_CLIENT_SECRET: ecs.Secret.fromSecretsManager(
              eclipseSecret,
              'ECLIPSE_CLIENT_SECRET'
            ),
            ECLIPSE_TENANT_ID: ecs.Secret.fromSecretsManager(eclipseSecret, 'ECLIPSE_TENANT_ID'),
            ECLIPSE_TENANT_IDENTITY: ecs.Secret.fromSecretsManager(
              eclipseSecret,
              'ECLIPSE_TENANT_IDENTITY'
            ),
            ECLIPSE_TENANT_PASSWORD: ecs.Secret.fromSecretsManager(
              eclipseSecret,
              'ECLIPSE_TENANT_PASSWORD'
            ),
            ECLIPSE_CALLBACK_BASE: ecs.Secret.fromSecretsManager(
              eclipseSecret,
              'ECLIPSE_CALLBACK_BASE'
            ),
            ECLIPSE_WEBHOOK_SECRET: ecs.Secret.fromSecretsManager(
              eclipseSecret,
              'ECLIPSE_WEBHOOK_SECRET'
            ),
          },
        },
      }
    );

    const webAcl = new wafv2.CfnWebACL(this, 'BackendWebAcl', {
      name: 'PashashaPay-Backend-RateLimit',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'backend-waf',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'RateLimitLogin',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 500,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'STARTS_WITH',
                  searchString: '/auth',
                  textTransformations: [{ priority: 0, type: 'NONE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'backend-waf-login',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitQr',
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 800,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'STARTS_WITH',
                  searchString: '/guards',
                  textTransformations: [{ priority: 0, type: 'NONE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'backend-waf-qr',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitUploads',
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 400,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                orStatement: {
                  statements: [
                    {
                      byteMatchStatement: {
                        fieldToMatch: { uriPath: {} },
                        positionalConstraint: 'CONTAINS',
                        searchString: '/kyc/documents',
                        textTransformations: [{ priority: 0, type: 'NONE' }],
                      },
                    },
                    {
                      byteMatchStatement: {
                        fieldToMatch: { uriPath: {} },
                        positionalConstraint: 'CONTAINS',
                        searchString: '/presign',
                        textTransformations: [{ priority: 0, type: 'NONE' }],
                      },
                    },
                  ],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'backend-waf-upload',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitPayout',
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 400,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'STARTS_WITH',
                  searchString: '/payments',
                  textTransformations: [{ priority: 0, type: 'NONE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'backend-waf-payout',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimitIpFallback',
          priority: 50,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'backend-waf-rate-limit',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, 'BackendWebAclAssociation', {
      resourceArn: service.loadBalancer.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    service.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
    });

    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 8,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 55,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    customersTable.grantReadWriteData(service.taskDefinition.taskRole);
    civilServantsTable.grantReadWriteData(service.taskDefinition.taskRole);
    paymentsTable.grantReadWriteData(service.taskDefinition.taskRole);
    userAssetsBucket.grantReadWrite(service.taskDefinition.taskRole);
    kycAssetsBucket.grantReadWrite(service.taskDefinition.taskRole);
    qrAssetsBucket.grantReadWrite(service.taskDefinition.taskRole);
    accountCounterTable.grantReadWriteData(service.taskDefinition.taskRole);
    administratorsTable.grantReadWriteData(service.taskDefinition.taskRole);
    supportTicketsTable.grantReadWriteData(service.taskDefinition.taskRole);
    customerPaymentStateMachine.grantStartExecution(service.taskDefinition.taskRole);
    supportTopic.grantPublish(service.taskDefinition.taskRole);
    signupTopic.grantPublish(service.taskDefinition.taskRole);
    auditLogsTable.grantReadWriteData(service.taskDefinition.taskRole);
    accountWorkflowCivil.grantStartExecution(service.taskDefinition.taskRole);
    accountWorkflowCustomer.grantStartExecution(service.taskDefinition.taskRole);
    accountWorkflowAdmin.grantStartExecution(service.taskDefinition.taskRole);
    service.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:ListUsersInGroup',
        ],
        resources: [userPool.userPoolArn],
      })
    );

    const distribution = new cloudfront.Distribution(this, 'BackendDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(service.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      enableLogging: false,
    });

    this.backendService = service.service;
    this.backendListener = service.listener;
    this.loadBalancerDnsName = service.loadBalancer.loadBalancerDnsName;
    this.apiEndpoint = `http://${this.loadBalancerDnsName}`;
    this.secureApiEndpoint = `https://${distribution.domainName}`;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    // --- Frontend Cognito config in Secrets Manager ---
    const frontendSecrets = new secretsmanager.Secret(this, 'FrontendSecrets', {
      secretName: 'pashashapay-frontend-config',
      description: 'Frontend config for Cognito integration',
      secretObjectValue: {
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: cdk.SecretValue.unsafePlainText(userPool.userPoolId),
        NEXT_PUBLIC_COGNITO_CLIENT_ID: cdk.SecretValue.unsafePlainText(
          userPoolClient.userPoolClientId
        ),
      },
    });

    // Allow Amplify SSR logging/build roles (with generated suffixes) to read the frontend secret.
    frontendSecrets.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        principals: [new iam.StarPrincipal()],
        conditions: {
          StringLike: {
            'aws:PrincipalArn': [
              `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AmplifySSRLoggingRole-*`,
              `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AmplifyBuildRole-*`,
            ],
          },
        },
        resources: [frontendSecrets.secretArn],
      })
    );

    // Fallback: allow any Amplify-associated role in this account to read the secret.
    frontendSecrets.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        principals: [new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID)],
        conditions: {
          ArnLike: {
            'aws:PrincipalArn': `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/*Amplify*`,
          },
        },
        resources: [frontendSecrets.secretArn],
      })
    );

    new cdk.CfnOutput(this, 'FrontendSecretsArn', {
      value: frontendSecrets.secretArn,
    });
    this.frontendSecretsArn = frontendSecrets.secretArn;

    // --- Standard outputs ---
    new cdk.CfnOutput(this, 'BackendLoadBalancerDns', {
      value: this.loadBalancerDnsName,
      exportName: 'PashashaPayBackendAlbDns',
    });
    new cdk.CfnOutput(this, 'BackendServiceSecurityGroup', {
      value: service.service.connections.securityGroups[0].securityGroupId,
    });
    new cdk.CfnOutput(this, 'BackendListenerArn', {
      value: this.backendListener.listenerArn,
    });
    new cdk.CfnOutput(this, 'BackendApiEndpoint', {
      value: this.apiEndpoint,
    });
    new cdk.CfnOutput(this, 'BackendSecureApiEndpoint', {
      value: this.secureApiEndpoint,
    });
    new cdk.CfnOutput(this, 'BackendCloudFrontDomain', {
      value: distribution.domainName,
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CustomersTableName', {
      value: customersTable.tableName,
    });
    new cdk.CfnOutput(this, 'CivilServantsTableName', {
      value: civilServantsTable.tableName,
    });
    new cdk.CfnOutput(this, 'AdministratorsTableName', {
      value: administratorsTable.tableName,
    });
    new cdk.CfnOutput(this, 'CustomerPaymentStateMachineArn', {
      value: customerPaymentStateMachine.stateMachineArn,
    });
    new cdk.CfnOutput(this, 'SupportTopicArn', {
      value: supportTopic.topicArn,
    });
    new cdk.CfnOutput(this, 'PaymentsTableName', {
      value: paymentsTable.tableName,
    });
    new cdk.CfnOutput(this, 'UserAssetsBucketName', {
      value: userAssetsBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'AccountCounterTableName', {
      value: accountCounterTable.tableName,
    });
    new cdk.CfnOutput(this, 'SupportTicketsTableName', {
      value: supportTicketsTable.tableName,
    });
  }
}
