import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface PashashaPayVoucherStackProps extends cdk.StackProps {}

export class PashashaPayVoucherStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly voucherVaultSecretArn: string;
  public readonly adminApiKeySecretArn: string;
  public readonly coreApiKeySecretArn: string;
  public readonly telegramBotTokenSecretArn: string;
  public readonly telegramWebhookSecretArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayVoucherStackProps = {}) {
    super(scope, id, props);

    const inventoryTable = new dynamodb.Table(this, 'VoucherInventoryTable', {
      tableName: 'PashashaPay-Voucher-Inventory',
      partitionKey: { name: 'voucherId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'bySupplierStatus',
      partitionKey: { name: 'supplierStatusKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'byDenominationStatus',
      partitionKey: { name: 'denominationStatusKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const allocationsTable = new dynamodb.Table(this, 'VoucherAllocationsTable', {
      tableName: 'PashashaPay-Voucher-Allocations',
      partitionKey: { name: 'allocationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    allocationsTable.addGlobalSecondaryIndex({
      indexName: 'byTransaction',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const barcodeRegistryTable = new dynamodb.Table(this, 'VoucherBarcodeRegistryTable', {
      tableName: 'PashashaPay-Voucher-Barcode-Registry',
      partitionKey: { name: 'barcodeHash', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });
    allocationsTable.addGlobalSecondaryIndex({
      indexName: 'byCivilServant',
      partitionKey: { name: 'civilServantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const voucherAuditTable = new dynamodb.Table(this, 'VoucherAuditTable', {
      tableName: 'PashashaPay-Voucher-Audit',
      partitionKey: { name: 'voucherId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    const voucherVaultSecret = new secretsmanager.Secret(this, 'VoucherVaultSecret', {
      secretName: 'pashasha/voucher/vault',
      description: 'Application-layer encryption key and config for voucher vault records',
      secretObjectValue: {
        keyVersion: cdk.SecretValue.unsafePlainText('v1'),
        masterKeyB64: cdk.SecretValue.unsafePlainText('pending-initialization'),
      },
    });

    const vaultSecretInitializerFn = new lambda.Function(this, 'VoucherVaultSecretInitializerFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
const { randomBytes } = require('crypto');
const { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({});

const isValidVaultSecret = (value) => {
  if (!value || typeof value.masterKeyB64 !== 'string') {
    return false;
  }
  try {
    return Buffer.from(value.masterKeyB64, 'base64').length === 32;
  } catch {
    return false;
  }
};

exports.handler = async (event, context) => {
  const secretArn = event.ResourceProperties.SecretArn;

  if (event.RequestType !== 'Delete') {
    const current = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
    const parsed = JSON.parse(current.SecretString || '{}');

    if (!isValidVaultSecret(parsed)) {
      const nextValue = {
        keyVersion: 'v1',
        masterKeyB64: randomBytes(32).toString('base64'),
      };
      await client.send(
        new PutSecretValueCommand({
          SecretId: secretArn,
          SecretString: JSON.stringify(nextValue),
        }),
      );
    }
  }

  return {
    PhysicalResourceId: secretArn,
    Data: { secretArn },
  };
};
      `),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
          resources: [voucherVaultSecret.secretArn],
        }),
      ],
    });

    const vaultSecretInitializerProvider = new cr.Provider(
      this,
      'VoucherVaultSecretInitializerProvider',
      {
        onEventHandler: vaultSecretInitializerFn,
      }
    );

    const vaultSecretInitializer = new cdk.CustomResource(this, 'VoucherVaultSecretInitializer', {
      serviceToken: vaultSecretInitializerProvider.serviceToken,
      properties: {
        SecretArn: voucherVaultSecret.secretArn,
        SecretVersion: 'v1',
      },
    });
    vaultSecretInitializer.node.addDependency(voucherVaultSecret);

    const adminApiKeySecret = new secretsmanager.Secret(this, 'VoucherAdminApiKeySecret', {
      secretName: 'pashasha/voucher/admin-api-key',
      description: 'Shared admin API key for voucher ingest and inventory endpoints',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });

    const coreApiKeySecret = new secretsmanager.Secret(this, 'VoucherCoreApiKeySecret', {
      secretName: 'pashasha/voucher/core-api-key',
      description: 'Shared API key used by core-backend to call voucher internal routes',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludePunctuation: true,
        passwordLength: 40,
      },
    });

    const telegramBotTokenSecret = new secretsmanager.Secret(
      this,
      'VoucherTelegramBotTokenSecret',
      {
        secretName: 'pashasha/voucher/telegram-bot-token',
        description: 'Telegram bot token for voucher admin ingest integrations',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: 'botToken',
          excludePunctuation: true,
          passwordLength: 48,
        },
      }
    );

    const telegramWebhookSecret = new secretsmanager.Secret(this, 'VoucherTelegramWebhookSecret', {
      secretName: 'pashasha/voucher/telegram-webhook-secret',
      description: 'Secret token used to verify Telegram voucher webhook requests',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'secretToken',
        excludePunctuation: true,
        passwordLength: 48,
      },
    });

    const handlersRoot = path.join(__dirname, '../../../apps/voucher/src/handlers');
    const runtimeEnv = {
      VOUCHER_INVENTORY_TABLE_NAME: inventoryTable.tableName,
      VOUCHER_BARCODE_REGISTRY_TABLE_NAME: barcodeRegistryTable.tableName,
      VOUCHER_ALLOCATIONS_TABLE_NAME: allocationsTable.tableName,
      VOUCHER_AUDIT_TABLE_NAME: voucherAuditTable.tableName,
      VOUCHER_VAULT_SECRET_ARN: voucherVaultSecret.secretArn,
      VOUCHER_ADMIN_API_KEY_SECRET_ARN: adminApiKeySecret.secretArn,
      VOUCHER_CORE_API_KEY_SECRET_ARN: coreApiKeySecret.secretArn,
      VOUCHER_TELEGRAM_BOT_TOKEN_SECRET_ARN: telegramBotTokenSecret.secretArn,
      VOUCHER_TELEGRAM_WEBHOOK_SECRET_ARN: telegramWebhookSecret.secretArn,
    };

    const ingestFn = new lambdaNodejs.NodejsFunction(this, 'VoucherIngestFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'ingestShopriteCheckers.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const listInventoryFn = new lambdaNodejs.NodejsFunction(this, 'VoucherListInventoryFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'listInventory.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: runtimeEnv,
    });

    const allocateVoucherFn = new lambdaNodejs.NodejsFunction(this, 'VoucherAllocateFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'allocateVoucher.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });
    const getAvailableDenominationsFn = new lambdaNodejs.NodejsFunction(
      this,
      'VoucherGetAvailableDenominationsFn',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(handlersRoot, 'getAvailableDenominations.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(15),
        environment: runtimeEnv,
      }
    );

    const telegramWebhookFn = new lambdaNodejs.NodejsFunction(this, 'VoucherTelegramWebhookFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(handlersRoot, 'telegramVoucherWebhook.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(20),
      environment: runtimeEnv,
    });

    const api = new apigwv2.HttpApi(this, 'VoucherV2HttpApi', {
      apiName: 'PashashaPay-VoucherApi',
      description: 'Greenfield MVP voucher boundary',
      createDefaultStage: true,
    });

    api.addRoutes({
      path: '/api/admin/vouchers/suppliers/shoprite-checkers/ingest',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('VoucherIngestIntegration', ingestFn),
    });

    api.addRoutes({
      path: '/api/admin/vouchers/inventory',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'VoucherListInventoryIntegration',
        listInventoryFn
      ),
    });
    api.addRoutes({
      path: '/internal/allocations',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'VoucherAllocateIntegration',
        allocateVoucherFn
      ),
    });
    api.addRoutes({
      path: '/internal/availability',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        'VoucherGetAvailableDenominationsIntegration',
        getAvailableDenominationsFn
      ),
    });
    api.addRoutes({
      path: '/webhooks/telegram/vouchers',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        'VoucherTelegramWebhookIntegration',
        telegramWebhookFn
      ),
    });

    inventoryTable.grantReadWriteData(ingestFn);
    inventoryTable.grantReadWriteData(telegramWebhookFn);
    inventoryTable.grantReadData(listInventoryFn);
    inventoryTable.grantReadWriteData(allocateVoucherFn);
    inventoryTable.grantReadData(getAvailableDenominationsFn);
    barcodeRegistryTable.grantReadWriteData(ingestFn);
    barcodeRegistryTable.grantReadWriteData(telegramWebhookFn);
    allocationsTable.grantReadWriteData(allocateVoucherFn);
    voucherAuditTable.grantReadWriteData(ingestFn);
    voucherAuditTable.grantReadWriteData(telegramWebhookFn);
    voucherAuditTable.grantReadWriteData(allocateVoucherFn);
    voucherVaultSecret.grantRead(ingestFn);
    voucherVaultSecret.grantRead(telegramWebhookFn);
    voucherVaultSecret.grantRead(allocateVoucherFn);
    adminApiKeySecret.grantRead(ingestFn);
    adminApiKeySecret.grantRead(listInventoryFn);
    coreApiKeySecret.grantRead(allocateVoucherFn);
    coreApiKeySecret.grantRead(getAvailableDenominationsFn);
    telegramBotTokenSecret.grantRead(telegramWebhookFn);
    telegramWebhookSecret.grantRead(telegramWebhookFn);

    this.apiUrl = api.apiEndpoint;
    this.voucherVaultSecretArn = voucherVaultSecret.secretArn;
    this.adminApiKeySecretArn = adminApiKeySecret.secretArn;
    this.coreApiKeySecretArn = coreApiKeySecret.secretArn;
    this.telegramBotTokenSecretArn = telegramBotTokenSecret.secretArn;
    this.telegramWebhookSecretArn = telegramWebhookSecret.secretArn;

    new cdk.CfnOutput(this, 'VoucherApiUrl', {
      value: this.apiUrl,
    });
    new cdk.CfnOutput(this, 'VoucherVaultSecretArn', {
      value: this.voucherVaultSecretArn,
    });
    new cdk.CfnOutput(this, 'VoucherAdminApiKeySecretArn', {
      value: this.adminApiKeySecretArn,
    });
    new cdk.CfnOutput(this, 'VoucherCoreApiKeySecretArn', {
      value: this.coreApiKeySecretArn,
    });
    new cdk.CfnOutput(this, 'VoucherTelegramBotTokenSecretArn', {
      value: this.telegramBotTokenSecretArn,
    });
    new cdk.CfnOutput(this, 'VoucherTelegramWebhookSecretArn', {
      value: this.telegramWebhookSecretArn,
    });
    new cdk.CfnOutput(this, 'VoucherInventoryTableName', {
      value: inventoryTable.tableName,
    });
    new cdk.CfnOutput(this, 'VoucherBarcodeRegistryTableName', {
      value: barcodeRegistryTable.tableName,
    });
    new cdk.CfnOutput(this, 'VoucherAllocationsTableName', {
      value: allocationsTable.tableName,
    });
    new cdk.CfnOutput(this, 'VoucherAuditTableName', {
      value: voucherAuditTable.tableName,
    });
  }
}
