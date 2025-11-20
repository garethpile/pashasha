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

  constructor(scope: Construct, id: string, props: SecurityGuardPaymentsBackendStackProps = {}) {
    super(scope, id, props);

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

    const buildPath = props.dockerBuildPath ?? path.join(__dirname, '../../..');
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
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 2,
        publicLoadBalancer: true,
        circuitBreaker: { rollback: true },
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
            PAYMENTS_TABLE_NAME: paymentsTable.tableName,
            USER_ASSETS_BUCKET: userAssetsBucket.bucketName,
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

    this.backendService = service.service;
    this.backendListener = service.listener;
    this.loadBalancerDnsName = service.loadBalancer.loadBalancerDnsName;
    this.apiEndpoint = `http://${this.loadBalancerDnsName}`;

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
    new cdk.CfnOutput(this, 'PaymentsTableName', {
      value: paymentsTable.tableName,
    });
    new cdk.CfnOutput(this, 'UserAssetsBucketName', {
      value: userAssetsBucket.bucketName,
    });
  }
}
