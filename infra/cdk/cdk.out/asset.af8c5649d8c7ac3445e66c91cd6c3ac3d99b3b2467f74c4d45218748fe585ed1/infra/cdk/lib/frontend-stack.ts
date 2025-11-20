import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';

export interface SecurityGuardPaymentsFrontendStackProps extends cdk.StackProps {
  /**
   * Fully qualified URL for the backend API (e.g. http://alb-dns-name)
   * This value is exposed to Next.js as NEXT_PUBLIC_API_BASE_URL.
   */
  readonly backendEndpoint: string;

  /**
   * Optional GitHub repository owner (e.g. "acme-org") for connected Amplify builds.
   */
  readonly repositoryOwner?: string;

  /**
   * Optional GitHub repository name (e.g. "securityguardpayments").
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
}

export class SecurityGuardPaymentsFrontendStack extends cdk.Stack {
  public readonly amplifyApp: amplify.App;
  public readonly primaryBranch: amplify.Branch;

  constructor(scope: Construct, id: string, props: SecurityGuardPaymentsFrontendStackProps) {
    super(scope, id, props);

    const normalizedBackend = props.backendEndpoint.replace(/\/$/, '');
    const envVars = {
      NEXT_PUBLIC_API_BASE_URL: `${normalizedBackend}/api/guards`,
      NEXT_PUBLIC_BACKEND_API_ROOT: `${normalizedBackend}/api`,
    };

    const buildSpec = codebuild.BuildSpec.fromObject({
      version: '1.0',
      applications: [
        {
          appRoot: '.',
          frontend: {
            phases: {
              preBuild: {
                commands: ['npm install'],
              },
              build: {
                commands: ['npm run build --workspace frontend'],
              },
            },
            artifacts: {
              baseDirectory: 'apps/frontend/out',
              files: ['**/*'],
            },
            cache: {
              paths: ['node_modules/**/*', 'apps/frontend/node_modules/**/*'],
            },
          },
          customRules: [
            {
              source: '/<*>',
              target: '/index.html',
              status: '200',
            },
          ],
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
      appName: 'security-guard-payments-frontend',
      description: 'Amplify hosted Next.js frontend for the Security Guard tip platform.',
      buildSpec,
      environmentVariables: envVars,
      autoBranchDeletion: true,
      sourceCodeProvider,
    };

    const app = new amplify.App(this, 'AmplifyApp', appProps);

    const branch = app.addBranch('PrimaryBranch', {
      branchName: props.branchName ?? 'main',
      environmentVariables: envVars,
      stage: 'PRODUCTION',
      autoBuild: false,
      pullRequestPreview: false,
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: app.appId,
    });

    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
      value: `https://${branch.branchName}.${app.defaultDomain}`,
    });

    this.amplifyApp = app;
    this.primaryBranch = branch;
  }
}
