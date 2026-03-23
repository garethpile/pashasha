import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface PashashaPayPaymentStackProps extends cdk.StackProps {}

export class PashashaPayPaymentStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly ozowConfigSecretArn: string;
  public readonly coreApiKeySecretArn: string;
  public readonly paymentToCoreApiKeySecretArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayPaymentStackProps = {}) {
    super(scope, id, props);

    const paymentIntentsTable = new dynamodb.Table(this, 'PaymentIntentsTable', {
      tableName: 'PashashaPay-Payment-Intents',
      partitionKey: { name: 'paymentIntentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    paymentIntentsTable.addGlobalSecondaryIndex({
      indexName: 'byTransaction',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const paymentEventsTable = new dynamodb.Table(this, 'PaymentEventsTable', {
      tableName: 'PashashaPay-Payment-Events',
      partitionKey: { name: 'paymentIntentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    const ozowConfigSecret = new secretsmanager.Secret(this, 'OzowConfigSecret', {
      secretName: 'pashasha/payment/ozow',
      description: 'OZOW credentials and callback signing settings for the greenfield MVP',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          siteCode: '',
          privateKey: '',
          apiKey: '',
          callbackSecret: '',
        }),
        generateStringKey: 'placeholder',
      },
    });

    const coreApiKeySecret = new secretsmanager.Secret(this, 'PaymentCoreApiKeySecret', {
      secretName: 'pashasha/payment/core-api-key',
      description: 'Shared API key used by core-backend to call payment internal routes',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });
    const paymentToCoreApiKeySecret = new secretsmanager.Secret(this, 'PaymentToCoreApiKeySecret', {
      secretName: 'pashasha/payment/to-core-api-key',
      description: 'Shared API key used by payment callback handlers to call core-backend',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });

    const handlersRoot = path.join(__dirname, '../../../apps/payment/src/handlers');
    const runtimeEnv = {
      PAYMENT_INTENTS_TABLE_NAME: paymentIntentsTable.tableName,
      PAYMENT_EVENTS_TABLE_NAME: paymentEventsTable.tableName,
      PAYMENT_CORE_API_KEY_SECRET_ARN: coreApiKeySecret.secretArn,
      OZOW_CONFIG_SECRET_ARN: ozowConfigSecret.secretArn,
      OZOW_PAYMENT_URL: 'https://pay.ozow.com',
      OZOW_IS_TEST: 'true',
      PAYMENT_PUBLIC_API_BASE_URL: 'https://placeholder.invalid',
      PAYMENT_TO_CORE_API_KEY_SECRET_ARN: paymentToCoreApiKeySecret.secretArn,
      CORE_API_URL: 'https://placeholder.invalid',
    };

    const createPaymentIntentFn = new lambdaNodejs.NodejsFunction(this, 'CreatePaymentIntentFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'createPaymentIntent.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const getPaymentIntentFn = new lambdaNodejs.NodejsFunction(this, 'GetPaymentIntentFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'getPaymentIntent.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const checkoutPlaceholderFn = new lambdaNodejs.NodejsFunction(this, 'CheckoutPlaceholderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'checkoutPlaceholder.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });
    const ozowCallbackFn = new lambdaNodejs.NodejsFunction(this, 'OzowCallbackFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'ozowCallback.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });

    const api = new apigwv2.HttpApi(this, 'PaymentHttpApi', {
      apiName: 'PashashaPay-PaymentApi',
      description: 'Greenfield MVP payment engine boundary',
      createDefaultStage: true,
    });

    createPaymentIntentFn.addEnvironment('PAYMENT_PUBLIC_API_BASE_URL', api.apiEndpoint);
    getPaymentIntentFn.addEnvironment('PAYMENT_PUBLIC_API_BASE_URL', api.apiEndpoint);
    checkoutPlaceholderFn.addEnvironment('PAYMENT_PUBLIC_API_BASE_URL', api.apiEndpoint);
    ozowCallbackFn.addEnvironment('PAYMENT_PUBLIC_API_BASE_URL', api.apiEndpoint);

    api.addRoutes({
      path: '/internal/payment-intents',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'CreatePaymentIntentIntegration',
        createPaymentIntentFn
      ),
    });
    api.addRoutes({
      path: '/internal/payment-intents/{paymentIntentId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'GetPaymentIntentIntegration',
        getPaymentIntentFn
      ),
    });
    api.addRoutes({
      path: '/checkout/{paymentIntentId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'CheckoutPlaceholderIntegration',
        checkoutPlaceholderFn
      ),
    });
    api.addRoutes({
      path: '/callbacks/ozow',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'OzowCallbackIntegration',
        ozowCallbackFn
      ),
    });

    paymentIntentsTable.grantReadWriteData(createPaymentIntentFn);
    paymentIntentsTable.grantReadData(getPaymentIntentFn);
    paymentIntentsTable.grantReadData(checkoutPlaceholderFn);
    paymentIntentsTable.grantReadWriteData(ozowCallbackFn);
    paymentEventsTable.grantReadWriteData(ozowCallbackFn);
    coreApiKeySecret.grantRead(createPaymentIntentFn);
    coreApiKeySecret.grantRead(getPaymentIntentFn);
    ozowConfigSecret.grantRead(checkoutPlaceholderFn);
    paymentToCoreApiKeySecret.grantRead(ozowCallbackFn);

    this.apiUrl = api.apiEndpoint;
    this.ozowConfigSecretArn = ozowConfigSecret.secretArn;
    this.coreApiKeySecretArn = coreApiKeySecret.secretArn;
    this.paymentToCoreApiKeySecretArn = paymentToCoreApiKeySecret.secretArn;

    new cdk.CfnOutput(this, 'PaymentApiUrl', {
      value: this.apiUrl,
    });
    new cdk.CfnOutput(this, 'OzowConfigSecretArn', {
      value: this.ozowConfigSecretArn,
    });
    new cdk.CfnOutput(this, 'PaymentCoreApiKeySecretArn', {
      value: this.coreApiKeySecretArn,
    });
    new cdk.CfnOutput(this, 'PaymentToCoreApiKeySecretArn', {
      value: this.paymentToCoreApiKeySecretArn,
    });
    new cdk.CfnOutput(this, 'PaymentIntentsTableName', {
      value: paymentIntentsTable.tableName,
    });
    new cdk.CfnOutput(this, 'PaymentEventsTableName', {
      value: paymentEventsTable.tableName,
    });
  }
}
