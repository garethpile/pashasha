import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface PashashaPayCoreBackendStackProps extends cdk.StackProps {
  readonly paymentApiUrl?: string;
  readonly voucherApiUrl?: string;
  readonly notificationsApiUrl?: string;
  readonly paymentCoreApiKeySecretArn?: string;
  readonly paymentToCoreApiKeySecretArn?: string;
  readonly voucherCoreApiKeySecretArn?: string;
  readonly notificationsCoreApiKeySecretArn?: string;
}

export class PashashaPayCoreBackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props: PashashaPayCoreBackendStackProps = {}) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'CoreUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        phone: true,
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: false, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      userPoolName: 'PashashaPay-Core-UserPool',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('CoreWebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      userPoolClientName: 'PashashaPay-Core-WebClient',
    });

    new cognito.CfnUserPoolGroup(this, 'CoreAdministratorsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Administrators',
    });
    new cognito.CfnUserPoolGroup(this, 'CoreCustomersGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Customers',
    });
    new cognito.CfnUserPoolGroup(this, 'CoreCivilServantsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'CivilServants',
    });

    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: 'PashashaPay-Core-Transactions',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'byCivilServant',
      partitionKey: { name: 'civilServantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'byCustomer',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'byPaymentIntent',
      partitionKey: { name: 'paymentIntentId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const profilesTable = new dynamodb.Table(this, 'ProfilesTable', {
      tableName: 'PashashaPay-Core-Profiles',
      partitionKey: { name: 'profileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    profilesTable.addGlobalSecondaryIndex({
      indexName: 'byQrToken',
      partitionKey: { name: 'qrToken', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    profilesTable.addGlobalSecondaryIndex({
      indexName: 'byCognitoSub',
      partitionKey: { name: 'cognitoSub', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const auditTable = new dynamodb.Table(this, 'AuditTable', {
      tableName: 'PashashaPay-Core-Audit',
      partitionKey: { name: 'auditId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    const accountSequencesTable = new dynamodb.Table(this, 'AccountSequencesTable', {
      tableName: 'PashashaPay-Core-Account-Sequences',
      partitionKey: { name: 'sequenceKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    const accessLogs = new logs.LogGroup(this, 'CoreApiAccessLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigwv2.HttpApi(this, 'CoreHttpApi', {
      apiName: 'PashashaPay-CoreBackendApi',
      description: 'Greenfield MVP core backend boundary',
      createDefaultStage: true,
      corsPreflight: {
        allowOrigins: ['*'],
        allowHeaders: [
          'content-type',
          'authorization',
          'x-admin-api-key',
          'x-core-api-key',
          'x-payment-callback-key',
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
      },
    });

    const adminApiKeySecret = new secretsmanager.Secret(this, 'CoreAdminApiKeySecret', {
      secretName: 'pashasha/core/admin-api-key',
      description: 'Shared admin API key for greenfield core bootstrap endpoints',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });

    const handlersRoot = path.join(__dirname, '../../../apps/core/src/handlers');
    const runtimeEnv = {
      PROFILES_TABLE_NAME: profilesTable.tableName,
      TRANSACTIONS_TABLE_NAME: transactionsTable.tableName,
      AUDIT_TABLE_NAME: auditTable.tableName,
      ACCOUNT_SEQUENCES_TABLE_NAME: accountSequencesTable.tableName,
      PAYMENT_API_URL: props.paymentApiUrl ?? '',
      VOUCHER_API_URL: props.voucherApiUrl ?? '',
      NOTIFICATIONS_API_URL: props.notificationsApiUrl ?? '',
      CORE_ADMIN_API_KEY_SECRET_ARN: adminApiKeySecret.secretArn,
      PAYMENT_CORE_API_KEY_SECRET_ARN: props.paymentCoreApiKeySecretArn ?? '',
      PAYMENT_TO_CORE_API_KEY_SECRET_ARN: props.paymentToCoreApiKeySecretArn ?? '',
      VOUCHER_CORE_API_KEY_SECRET_ARN: props.voucherCoreApiKeySecretArn ?? '',
      NOTIFICATIONS_CORE_API_KEY_SECRET_ARN: props.notificationsCoreApiKeySecretArn ?? '',
    };

    const healthFn = new lambdaNodejs.NodejsFunction(this, 'CoreHealthFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'health.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const createCivilServantFn = new lambdaNodejs.NodejsFunction(this, 'CreateCivilServantFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'createCivilServant.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const lookupCivilServantFn = new lambdaNodejs.NodejsFunction(this, 'LookupCivilServantFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'lookupCivilServant.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });
    const searchCivilServantsFn = new lambdaNodejs.NodejsFunction(this, 'SearchCivilServantsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'searchCivilServants.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });
    const checkEmailFn = new lambdaNodejs.NodejsFunction(this, 'CheckEmailFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'checkEmail.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: {
        ...runtimeEnv,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
      },
    });
    const signupFn = new lambdaNodejs.NodejsFunction(this, 'SignupFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'signup.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: {
        ...runtimeEnv,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });
    const confirmSignupFn = new lambdaNodejs.NodejsFunction(this, 'ConfirmSignupFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'confirmSignup.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: {
        ...runtimeEnv,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });
    const resendSignupCodeFn = new lambdaNodejs.NodejsFunction(this, 'ResendSignupCodeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'resendSignupCode.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: {
        ...runtimeEnv,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const createPaymentIntentFn = new lambdaNodejs.NodejsFunction(
      this,
      'CoreCreatePaymentIntentFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'createPaymentIntent.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );

    const getPaymentIntentFn = new lambdaNodejs.NodejsFunction(this, 'CoreGetPaymentIntentFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getPaymentIntent.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const confirmPaymentFn = new lambdaNodejs.NodejsFunction(this, 'CoreConfirmPaymentFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'confirmPayment.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });
    const syncPaymentStatusFn = new lambdaNodejs.NodejsFunction(this, 'SyncPaymentStatusFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'syncPaymentStatus.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });
    const loadPaymentCompletionContextFn = new lambdaNodejs.NodejsFunction(
      this,
      'LoadPaymentCompletionContextFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'loadPaymentCompletionContext.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const ensureVoucherAllocationFn = new lambdaNodejs.NodejsFunction(
      this,
      'EnsureVoucherAllocationFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'ensureVoucherAllocation.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const sendPaymentNotificationsFn = new lambdaNodejs.NodejsFunction(
      this,
      'SendPaymentNotificationsFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'sendPaymentNotifications.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const finalizePaymentCompletionFn = new lambdaNodejs.NodejsFunction(
      this,
      'FinalizePaymentCompletionFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'finalizePaymentCompletion.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const markPaymentCompletionFailedFn = new lambdaNodejs.NodejsFunction(
      this,
      'MarkPaymentCompletionFailedFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'markPaymentCompletionFailed.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const getCustomerMeFn = new lambdaNodejs.NodejsFunction(this, 'GetCustomerMeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getCustomerMe.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const updateCustomerMeFn = new lambdaNodejs.NodejsFunction(this, 'UpdateCustomerMeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'updateCustomerMe.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const getCustomerKycFn = new lambdaNodejs.NodejsFunction(this, 'GetCustomerKycFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getCustomerKyc.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const getCivilServantMeFn = new lambdaNodejs.NodejsFunction(this, 'GetCivilServantMeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getCivilServantMe.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const updateCivilServantMeFn = new lambdaNodejs.NodejsFunction(this, 'UpdateCivilServantMeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'updateCivilServantMe.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const getCivilServantQrCodeFn = new lambdaNodejs.NodejsFunction(
      this,
      'GetCivilServantQrCodeFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'getCivilServantQrCode.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const getCivilServantKycFn = new lambdaNodejs.NodejsFunction(this, 'GetCivilServantKycFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getCivilServantKyc.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const listCustomerTransactionsMeFn = new lambdaNodejs.NodejsFunction(
      this,
      'ListCustomerTransactionsMeFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'listCustomerTransactionsMe.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );
    const listCivilServantTransactionsMeFn = new lambdaNodejs.NodejsFunction(
      this,
      'ListCivilServantTransactionsMeFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'listCivilServantTransactionsMe.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(20),
        environment: runtimeEnv,
      }
    );

    const loadPaymentCompletionContextTask = new tasks.LambdaInvoke(
      this,
      'LoadPaymentCompletionContextTask',
      {
        lambdaFunction: loadPaymentCompletionContextFn,
        payloadResponseOnly: true,
        resultPath: '$.context',
      }
    );
    const ensureVoucherAllocationTask = new tasks.LambdaInvoke(
      this,
      'EnsureVoucherAllocationTask',
      {
        lambdaFunction: ensureVoucherAllocationFn,
        payloadResponseOnly: true,
        resultPath: '$.allocation',
      }
    );
    const sendPaymentNotificationsTask = new tasks.LambdaInvoke(
      this,
      'SendPaymentNotificationsTask',
      {
        lambdaFunction: sendPaymentNotificationsFn,
        payloadResponseOnly: true,
        resultPath: '$.notifications',
      }
    );
    const finalizePaymentCompletionTask = new tasks.LambdaInvoke(
      this,
      'FinalizePaymentCompletionTask',
      {
        lambdaFunction: finalizePaymentCompletionFn,
        payloadResponseOnly: true,
        resultPath: '$.finalized',
      }
    );
    const markPaymentCompletionFailedTask = new tasks.LambdaInvoke(
      this,
      'MarkPaymentCompletionFailedTask',
      {
        lambdaFunction: markPaymentCompletionFailedFn,
        payloadResponseOnly: true,
        resultPath: '$.failure',
      }
    );

    const alreadyCompletedSucceed = new sfn.Succeed(this, 'PaymentAlreadyCompleted');
    const workflowSucceeded = new sfn.Succeed(this, 'PaymentCompletionSucceeded');
    const workflowFailed = new sfn.Fail(this, 'PaymentCompletionFailed');
    const failureChain = markPaymentCompletionFailedTask.next(workflowFailed);

    loadPaymentCompletionContextTask.addCatch(failureChain, { resultPath: '$.error' });
    ensureVoucherAllocationTask.addCatch(failureChain, { resultPath: '$.error' });
    sendPaymentNotificationsTask.addCatch(failureChain, { resultPath: '$.error' });
    finalizePaymentCompletionTask.addCatch(failureChain, { resultPath: '$.error' });

    const paymentCompletionStateMachine = new sfn.StateMachine(
      this,
      'PaymentCompletionStateMachine',
      {
        stateMachineName: 'PashashaPay-PaymentCompletion',
        timeout: cdk.Duration.minutes(2),
        definitionBody: sfn.DefinitionBody.fromChainable(
          loadPaymentCompletionContextTask.next(
            new sfn.Choice(this, 'PaymentAlreadyCompletedChoice')
              .when(
                sfn.Condition.booleanEquals('$.context.alreadyCompleted', true),
                alreadyCompletedSucceed
              )
              .otherwise(
                ensureVoucherAllocationTask
                  .next(sendPaymentNotificationsTask)
                  .next(finalizePaymentCompletionTask)
                  .next(workflowSucceeded)
              )
          )
        ),
      }
    );

    confirmPaymentFn.addEnvironment(
      'PAYMENT_COMPLETION_STATE_MACHINE_ARN',
      paymentCompletionStateMachine.stateMachineArn
    );
    paymentCompletionStateMachine.grantStartExecution(confirmPaymentFn);

    api.addRoutes({
      path: '/api/health',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('CoreHealthIntegration', healthFn),
    });
    api.addRoutes({
      path: '/api/admin/civil-servants',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'CreateCivilServantIntegration',
        createCivilServantFn
      ),
    });
    api.addRoutes({
      path: '/api/public/civil-servants/lookup',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'LookupCivilServantIntegration',
        lookupCivilServantFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/lookup',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'SearchCivilServantsIntegration',
        searchCivilServantsFn
      ),
    });
    api.addRoutes({
      path: '/auth/check-email',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('CheckEmailIntegration', checkEmailFn),
    });
    api.addRoutes({
      path: '/auth/signup',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('SignupIntegration', signupFn),
    });
    api.addRoutes({
      path: '/auth/confirm-signup',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'ConfirmSignupIntegration',
        confirmSignupFn
      ),
    });
    api.addRoutes({
      path: '/auth/resend-signup-code',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'ResendSignupCodeIntegration',
        resendSignupCodeFn
      ),
    });
    api.addRoutes({
      path: '/customers/me',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetCustomerMeIntegration',
        getCustomerMeFn
      ),
    });
    api.addRoutes({
      path: '/customers/me',
      methods: [apigwv2.HttpMethod.PUT],
      integration: new integrations.HttpLambdaIntegration(
        'UpdateCustomerMeIntegration',
        updateCustomerMeFn
      ),
    });
    api.addRoutes({
      path: '/customers/me/transactions',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'ListCustomerTransactionsMeIntegration',
        listCustomerTransactionsMeFn
      ),
    });
    api.addRoutes({
      path: '/customers/me/transactions/sent',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'ListCustomerSentTransactionsMeIntegration',
        listCustomerTransactionsMeFn
      ),
    });
    api.addRoutes({
      path: '/customers/me/kyc',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetCustomerKycIntegration',
        getCustomerKycFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetCivilServantMeIntegration',
        getCivilServantMeFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me',
      methods: [apigwv2.HttpMethod.PUT],
      integration: new integrations.HttpLambdaIntegration(
        'UpdateCivilServantMeIntegration',
        updateCivilServantMeFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me/qr-code',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetCivilServantQrCodeIntegration',
        getCivilServantQrCodeFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me/kyc',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetCivilServantKycIntegration',
        getCivilServantKycFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me/transactions',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'ListCivilServantTransactionsMeIntegration',
        listCivilServantTransactionsMeFn
      ),
    });
    api.addRoutes({
      path: '/civil-servants/me/transactions/pending',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'ListCivilServantPendingTransactionsMeIntegration',
        listCivilServantTransactionsMeFn
      ),
    });
    api.addRoutes({
      path: '/api/public/payment-intents',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'CoreCreatePaymentIntentIntegration',
        createPaymentIntentFn
      ),
    });
    api.addRoutes({
      path: '/api/public/payment-intents/{paymentIntentId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'CoreGetPaymentIntentIntegration',
        getPaymentIntentFn
      ),
    });
    api.addRoutes({
      path: '/internal/payments/{paymentIntentId}/confirm',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'CoreConfirmPaymentIntegration',
        confirmPaymentFn
      ),
    });
    api.addRoutes({
      path: '/internal/payments/{paymentIntentId}/status',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'CoreSyncPaymentStatusIntegration',
        syncPaymentStatusFn
      ),
    });

    profilesTable.grantReadWriteData(createCivilServantFn);
    accountSequencesTable.grantReadWriteData(createCivilServantFn);
    profilesTable.grantReadData(lookupCivilServantFn);
    profilesTable.grantReadData(searchCivilServantsFn);
    profilesTable.grantReadData(checkEmailFn);
    profilesTable.grantReadWriteData(signupFn);
    accountSequencesTable.grantReadWriteData(signupFn);
    profilesTable.grantReadWriteData(confirmSignupFn);
    profilesTable.grantReadWriteData(getCustomerMeFn);
    profilesTable.grantReadWriteData(updateCustomerMeFn);
    profilesTable.grantReadData(getCustomerKycFn);
    profilesTable.grantReadWriteData(getCivilServantMeFn);
    profilesTable.grantReadWriteData(updateCivilServantMeFn);
    accountSequencesTable.grantReadWriteData(getCustomerMeFn);
    accountSequencesTable.grantReadWriteData(getCivilServantMeFn);
    profilesTable.grantReadData(getCivilServantQrCodeFn);
    profilesTable.grantReadData(getCivilServantKycFn);
    profilesTable.grantReadData(listCustomerTransactionsMeFn);
    profilesTable.grantReadData(listCivilServantTransactionsMeFn);
    transactionsTable.grantReadData(listCustomerTransactionsMeFn);
    transactionsTable.grantReadData(listCivilServantTransactionsMeFn);
    profilesTable.grantReadData(createPaymentIntentFn);
    transactionsTable.grantReadWriteData(createPaymentIntentFn);
    transactionsTable.grantReadData(getPaymentIntentFn);
    transactionsTable.grantReadWriteData(confirmPaymentFn);
    profilesTable.grantReadData(confirmPaymentFn);
    transactionsTable.grantReadWriteData(syncPaymentStatusFn);
    transactionsTable.grantReadWriteData(loadPaymentCompletionContextFn);
    profilesTable.grantReadData(loadPaymentCompletionContextFn);
    transactionsTable.grantReadWriteData(finalizePaymentCompletionFn);
    transactionsTable.grantReadWriteData(markPaymentCompletionFailedFn);
    adminApiKeySecret.grantRead(createCivilServantFn);
    userPool.grant(checkEmailFn, 'cognito-idp:ListUsers');
    userPool.grant(signupFn, 'cognito-idp:SignUp');
    userPool.grant(signupFn, 'cognito-idp:AdminAddUserToGroup');
    userPool.grant(confirmSignupFn, 'cognito-idp:ConfirmSignUp');
    userPool.grant(resendSignupCodeFn, 'cognito-idp:ResendConfirmationCode');
    userPool.grant(getCustomerMeFn, 'cognito-idp:GetUser');
    userPool.grant(updateCustomerMeFn, 'cognito-idp:GetUser');
    userPool.grant(getCustomerKycFn, 'cognito-idp:GetUser');
    userPool.grant(getCivilServantMeFn, 'cognito-idp:GetUser');
    userPool.grant(updateCivilServantMeFn, 'cognito-idp:GetUser');
    userPool.grant(getCivilServantQrCodeFn, 'cognito-idp:GetUser');
    userPool.grant(getCivilServantKycFn, 'cognito-idp:GetUser');
    userPool.grant(listCustomerTransactionsMeFn, 'cognito-idp:GetUser');
    userPool.grant(listCivilServantTransactionsMeFn, 'cognito-idp:GetUser');
    if (props.paymentCoreApiKeySecretArn) {
      const paymentCoreApiKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'PaymentCoreApiKeySecret',
        props.paymentCoreApiKeySecretArn
      );
      paymentCoreApiKeySecret.grantRead(createPaymentIntentFn);
      paymentCoreApiKeySecret.grantRead(getPaymentIntentFn);
    }
    if (props.paymentToCoreApiKeySecretArn) {
      const paymentToCoreApiKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'PaymentToCoreApiKeySecret',
        props.paymentToCoreApiKeySecretArn
      );
      paymentToCoreApiKeySecret.grantRead(confirmPaymentFn);
      paymentToCoreApiKeySecret.grantRead(syncPaymentStatusFn);
    }
    if (props.voucherCoreApiKeySecretArn) {
      const voucherCoreApiKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'VoucherCoreApiKeySecret',
        props.voucherCoreApiKeySecretArn
      );
      voucherCoreApiKeySecret.grantRead(lookupCivilServantFn);
      voucherCoreApiKeySecret.grantRead(createPaymentIntentFn);
      voucherCoreApiKeySecret.grantRead(ensureVoucherAllocationFn);
    }
    if (props.notificationsCoreApiKeySecretArn) {
      const notificationsCoreApiKeySecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'NotificationsCoreApiKeySecret',
        props.notificationsCoreApiKeySecretArn
      );
      notificationsCoreApiKeySecret.grantRead(sendPaymentNotificationsFn);
    }

    const stage = api.defaultStage;
    if (stage) {
      const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
      cfnStage.accessLogSettings = {
        destinationArn: accessLogs.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          routeKey: '$context.routeKey',
          status: '$context.status',
          requestTime: '$context.requestTime',
        }),
      };
    }

    this.apiUrl = api.apiEndpoint;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    new cdk.CfnOutput(this, 'CoreApiUrl', {
      value: this.apiUrl,
    });
    new cdk.CfnOutput(this, 'CoreUserPoolId', {
      value: this.userPoolId,
    });
    new cdk.CfnOutput(this, 'CoreUserPoolClientId', {
      value: this.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CorePaymentApiUrl', {
      value: props.paymentApiUrl ?? 'not-configured',
    });
    new cdk.CfnOutput(this, 'CoreVoucherApiUrl', {
      value: props.voucherApiUrl ?? 'not-configured',
    });
    new cdk.CfnOutput(this, 'CoreNotificationsApiUrl', {
      value: props.notificationsApiUrl ?? 'not-configured',
    });
    new cdk.CfnOutput(this, 'CoreAdminApiKeySecretArn', {
      value: adminApiKeySecret.secretArn,
    });
    new cdk.CfnOutput(this, 'CorePaymentCompletionStateMachineArn', {
      value: paymentCompletionStateMachine.stateMachineArn,
    });
  }
}
