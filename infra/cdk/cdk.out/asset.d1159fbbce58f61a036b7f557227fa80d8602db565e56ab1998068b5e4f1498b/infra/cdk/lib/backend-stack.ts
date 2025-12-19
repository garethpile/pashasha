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

export interface SecurityGuardPaymentsBackendStackProps extends cdk.StackProps {
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

export class SecurityGuardPaymentsBackendStack extends cdk.Stack {
  public readonly backendService: ecs.FargateService;
  public readonly backendListener: elbv2.ApplicationListener;
  public readonly loadBalancerDnsName: string;
  public readonly apiEndpoint: string;
  public readonly secureApiEndpoint: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props: SecurityGuardPaymentsBackendStackProps = {}) {
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
    });

    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
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
      tableName: 'sgp-customers',
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
      tableName: 'sgp-civil-servants',
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
      tableName: 'sgp-administrators',
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
      tableName: 'sgp-payments',
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
      tableName: 'sgp-account-counters',
    });

    const userAssetsBucket = new s3.Bucket(this, 'UserAssetsBucket', {
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

    const logGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: '/security-guard-payments/backend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workflowLogGroup = new logs.LogGroup(this, 'AccountWorkflowLogs', {
      logGroupName: '/security-guard-payments/account-workflow',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Eclipse sandbox secret (contains ECLIPSE_API_BASE, ECLIPSE_TENANT_ID, etc.)
    const eclipseSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'EclipseSandboxSecret',
      'arn:aws:secretsmanager:eu-west-1:732439976770:secret:prod/pashashapay/eclipse-GLKO1K'
    );

    const signupTopic = new sns.Topic(this, 'SignupNotificationsTopic', {
      topicName: 'Pashasha-AccountProvisioning',
      displayName: 'Pashasha Account Provisioning',
    });

    const paymentsTopic = new sns.Topic(this, 'PaymentsNotificationsTopic', {
      topicName: 'Pashasha-Payments',
      displayName: 'Pashasha Payments',
    });

    const guardPortalBaseUrl =
      props?.env?.region && props?.env?.region.startsWith('eu-')
        ? (process.env.GUARD_PORTAL_BASE_URL ?? 'https://main.d2vxflzymkt19g.amplifyapp.com')
        : (process.env.GUARD_PORTAL_BASE_URL ?? 'https://main.d2vxflzymkt19g.amplifyapp.com');

    const workflowFunction = new lambdaNode.NodejsFunction(this, 'AccountWorkflowLambda', {
      entry: path.join(__dirname, '../../lambda/account-workflow/handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
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
      stateMachineName: 'Pashasha-AccountProvisioning-CivilServant',
      definitionBody: sfn.DefinitionBody.fromChainable(civilDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    const accountWorkflowCustomer = new sfn.StateMachine(this, 'AccountProvisioningCustomer', {
      stateMachineName: 'Pashasha-AccountProvisioning-Customer',
      definitionBody: sfn.DefinitionBody.fromChainable(customerDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    const accountWorkflowAdmin = new sfn.StateMachine(this, 'AccountProvisioningAdministrator', {
      stateMachineName: 'Pashasha-AccountProvisioning-Administrator',
      definitionBody: sfn.DefinitionBody.fromChainable(adminDefinition),
      tracingEnabled: true,
      logs: {
        destination: workflowLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

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
        taskImageOptions: {
          image: containerImage,
          containerPort: 4000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'backend',
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
            COUNTER_TABLE_NAME: accountCounterTable.tableName,
            GUARD_PORTAL_BASE_URL: guardPortalBaseUrl,
            SIGNUP_SNS_TOPIC_ARN: signupTopic.topicArn,
            ACCOUNT_WORKFLOW_ARN: accountWorkflowCivil.stateMachineArn,
            ACCOUNT_WORKFLOW_ARN_CIVIL: accountWorkflowCivil.stateMachineArn,
            ACCOUNT_WORKFLOW_ARN_CUSTOMER: accountWorkflowCustomer.stateMachineArn,
            ACCOUNT_WORKFLOW_ARN_ADMINISTRATOR: accountWorkflowAdmin.stateMachineArn,
            TENANT_WALLET_ID: process.env.TENANT_WALLET_ID ?? '',
          },
          secrets: {
            ECLIPSE_API_BASE: ecs.Secret.fromSecretsManager(eclipseSecret, 'ECLIPSE_API_BASE'),
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

    service.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
    });

    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 2,
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
    accountCounterTable.grantReadWriteData(service.taskDefinition.taskRole);
    administratorsTable.grantReadWriteData(service.taskDefinition.taskRole);
    signupTopic.grantPublish(service.taskDefinition.taskRole);
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

    new cdk.CfnOutput(this, 'BackendLoadBalancerDns', {
      value: this.loadBalancerDnsName,
      exportName: 'SecurityGuardPaymentsBackendAlbDns',
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
    new cdk.CfnOutput(this, 'PaymentsTableName', {
      value: paymentsTable.tableName,
    });
    new cdk.CfnOutput(this, 'UserAssetsBucketName', {
      value: userAssetsBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'AccountCounterTableName', {
      value: accountCounterTable.tableName,
    });
  }
}
