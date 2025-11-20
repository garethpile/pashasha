import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';

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
  }
}
