import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { AmplifySSRLoggingRolePatch } from './ssr-logging-role-patch';

export interface PashashaPayFrontendStackProps extends cdk.StackProps {
  /**
   * Fully qualified URL for the backend API (e.g. http://alb-dns-name)
   * This value is exposed to Next.js as NEXT_PUBLIC_API_BASE_URL.
   */
  readonly backendEndpoint: string;
  /**
   * Optional HTTPS endpoint (e.g. CloudFront) that proxies to the backend API.
   * When provided, this value is used for public API URLs while the original
   * endpoint remains referenced to preserve stack exports.
   */
  readonly backendSecureEndpoint?: string;

  /** Cognito User Pool identifier that the frontend should target. */
  readonly cognitoUserPoolId: string;

  /** Cognito User Pool web client id used by the SPA. */
  readonly cognitoUserPoolClientId: string;

  /** AWS region that hosts the Cognito resources and API. */
  readonly awsRegion: string;

  /**
   * Optional GitHub repository owner (e.g. "acme-org") for connected Amplify builds.
   */
  readonly repositoryOwner?: string;

  /**
   * Optional GitHub repository name (e.g. "pashashapay").
   */
  readonly repositoryName?: string;

  /**
   * Optional Secrets Manager ARN/Name that stores a GitHub personal access token
   * with repo and admin:repo_hook scopes for Amplify to connect.
   */
  readonly githubTokenSecretArn?: string;

  /**
   * Branch to deploy (defaults to main).
   */
  readonly branchName?: string;

  /**
   * Enable patching the Amplify SSR logging role (only if the role exists).
   */
  readonly enableSsrLoggingRolePatch?: boolean;

  /**
   * ARN of the frontend config secret in Secrets Manager.
   */
  readonly frontendSecretsArn: string;
}

export class PashashaPayFrontendStack extends cdk.Stack {
  public readonly amplifyApp: amplify.App;
  public readonly primaryBranch: amplify.Branch;

  constructor(scope: Construct, id: string, props: PashashaPayFrontendStackProps) {
    super(scope, id, props);

    const legacyBackend = props.backendEndpoint.replace(/\/$/, '');
    const normalizedBackend = (props.backendSecureEndpoint ?? props.backendEndpoint).replace(
      /\/$/,
      ''
    );
    const envVars = {
      // Point public calls at the base API; clients append subpaths (e.g., /guards).
      NEXT_PUBLIC_API_BASE_URL: `${normalizedBackend}/api`,
      NEXT_PUBLIC_BACKEND_API_ROOT: `${normalizedBackend}/api`,
      // Kept for backward compatibility where the ALB host is still needed.
      NEXT_PUBLIC_LEGACY_BACKEND_BASE: legacyBackend,
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
      NEXT_PUBLIC_COGNITO_CLIENT_ID: props.cognitoUserPoolClientId,
      NEXT_PUBLIC_AWS_REGION: props.awsRegion,
    };

    const buildSpec = codebuild.BuildSpec.fromObject({
      version: '1.0',
      applications: [
        {
          appRoot: 'apps/frontend',
          frontend: {
            phases: {
              preBuild: {
                commands: [
                  'npm ci --workspaces --prefer-offline=false --no-audit --progress=false',
                  'npm run build --workspace @pashashapay/contracts',
                ],
              },
              build: {
                commands: ['npm run build --workspace frontend'],
              },
            },
            artifacts: {
              baseDirectory: '.next',
              files: ['**/*'],
            },
            cache: {
              paths: ['node_modules/**/*'],
            },
          },
        },
      ],
    });

    const sourceCodeProvider =
      props.repositoryOwner && props.repositoryName && props.githubTokenSecretArn
        ? new amplify.GitHubSourceCodeProvider({
            owner: props.repositoryOwner,
            repository: props.repositoryName,
            oauthToken: cdk.SecretValue.secretsManager(props.githubTokenSecretArn, {
              jsonField: 'githubToken',
            }),
          })
        : undefined;

    const appProps: amplify.AppProps = {
      appName: 'PashashaPay',
      buildSpec,
      environmentVariables: envVars,
      autoBranchDeletion: true,
      sourceCodeProvider,
      platform: amplify.Platform.WEB_COMPUTE,
    };

    const app = new amplify.App(this, 'AmplifyApp', appProps);

    const branch = app.addBranch('PrimaryBranch', {
      branchName: props.branchName ?? 'master',
      environmentVariables: envVars,
      stage: 'PRODUCTION',
      autoBuild: false,
      pullRequestPreview: false,
    });

    // Route53 record to point www.dev.pashasha.com to the Amplify branch domain
    const hostedZone = route53.HostedZone.fromLookup(this, 'PashashaHostedZone', {
      domainName: 'pashasha.com',
    });

    const amplifyBranchDomain = `${branch.branchName}.${app.defaultDomain}`;

    new route53.CnameRecord(this, 'DevRootCname', {
      zone: hostedZone,
      recordName: 'dev.pashasha.com',
      domainName: amplifyBranchDomain,
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'WwwDevCname', {
      zone: hostedZone,
      recordName: 'www.dev.pashasha.com',
      domainName: amplifyBranchDomain,
      ttl: cdk.Duration.minutes(5),
    });

    // Role required by Amplify custom domain activation.
    new cdk.aws_iam.Role(this, 'AmplifyDomainRole', {
      roleName: 'AWSAmplifyDomainRole-Z07482111XTU7482PPQXE',
      assumedBy: new cdk.aws_iam.ServicePrincipal('amplify.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
      ],
    });

    // IAM role for Amplify build to access frontend secret
    const amplifyBuildRole = new cdk.aws_iam.Role(this, 'AmplifyBuildRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'IAM role for Amplify build to access frontend config secret',
    });

    // Grant read access to the frontend secret
    amplifyBuildRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.frontendSecretsArn],
      })
    );

    // Output the build role ARN for reference
    new cdk.CfnOutput(this, 'AmplifyBuildRoleArn', {
      value: amplifyBuildRole.roleArn,
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: app.appId,
    });

    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
      value: `https://${branch.branchName}.${app.defaultDomain}`,
    });

    this.amplifyApp = app;
    this.primaryBranch = branch;

    // Patch SSR Logging Role for Amplify with secret access (if role exists)
    if (props.enableSsrLoggingRolePatch) {
      new AmplifySSRLoggingRolePatch(this, 'SSRLoggingRolePatch', {
        secretArn: props.frontendSecretsArn,
      });
    }
  }
}
