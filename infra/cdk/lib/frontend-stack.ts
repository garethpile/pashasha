import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface PashashaPayFrontendStackProps extends cdk.StackProps {
  readonly backendEndpoint: string;
  readonly backendSecureEndpoint?: string;
  readonly deploymentEnvironment: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoUserPoolClientId: string;
  readonly awsRegion: string;
  readonly repositoryOwner?: string;
  readonly repositoryName?: string;
  readonly githubTokenSecretArn?: string;
  readonly branchName?: string;
  readonly enableSsrLoggingRolePatch?: boolean;
  readonly frontendSecretsArn?: string;
  readonly hostedZoneDomainName?: string;
  readonly manageDnsRecords?: boolean;
}

export class PashashaPayFrontendStack extends cdk.Stack {
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: PashashaPayFrontendStackProps) {
    super(scope, id, props);
    const deploymentEnvironment = (props.deploymentEnvironment || 'dev').toLowerCase();

    const siteBucket = new s3.Bucket(this, 'FrontendSiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const urlRewriteFunction = new cloudfront.Function(this, 'FrontendUrlRewriteFunction', {
      code: cloudfront.FunctionCode.fromInline(
        `
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '/') {
    return request;
  }

  if (uri.endsWith('/')) {
    request.uri = uri.slice(0, -1) + '.html';
    return request;
  }

  if (!uri.includes('.')) {
    request.uri = uri + '.html';
  }

  return request;
}
      `.trim()
      ),
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: urlRewriteFunction,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset('../../apps/frontend/out')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: true,
    });

    if (props.hostedZoneDomainName && props.manageDnsRecords) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'PashashaHostedZone', {
        domainName: props.hostedZoneDomainName,
      });
      const domainName = props.hostedZoneDomainName;
      const isProduction =
        deploymentEnvironment === 'prod' || deploymentEnvironment === 'production';
      const prefix = isProduction ? '' : `${deploymentEnvironment}.`;
      const rootRecordName = isProduction ? domainName : `${prefix}${domainName}`;
      const wwwRecordName = isProduction ? `www.${domainName}` : `www.${prefix}${domainName}`;

      new route53.ARecord(this, 'FrontendRootAlias', {
        zone: hostedZone,
        recordName: rootRecordName,
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      });

      new route53.ARecord(this, 'FrontendWwwAlias', {
        zone: hostedZone,
        recordName: wwwRecordName,
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
      });

      new cdk.CfnOutput(this, 'FrontendFriendlyUrl', {
        value: `https://${rootRecordName}`,
      });
    }

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: siteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: distribution.distributionId,
    });

    new cdk.CfnOutput(this, 'FrontendDistributionDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });

    this.siteBucket = siteBucket;
    this.distribution = distribution;
  }
}
