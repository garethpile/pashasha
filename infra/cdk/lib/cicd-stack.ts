import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface PashashaPayCicdStackProps extends cdk.StackProps {
  readonly deploymentEnvironment: string;
  readonly githubOwner: string;
  readonly githubRepo: string;
}

const resolveGithubEnvironment = (deploymentEnvironment: string) => {
  const normalized = deploymentEnvironment.toLowerCase();
  if (normalized === 'prod' || normalized === 'production') return 'production';
  if (normalized === 'test') return 'test';
  return 'dev';
};

const resolveRoleName = (githubEnvironment: string) => {
  if (githubEnvironment === 'production') return 'GitHubActionsPashashaProdDeployRole';
  if (githubEnvironment === 'test') return 'GitHubActionsPashashaTestDeployRole';
  return 'GitHubActionsPashashaDevDeployRole';
};

const resolveWorkflowRefPattern = (
  githubOwner: string,
  githubRepo: string,
  githubEnvironment: string
) => {
  if (githubEnvironment === 'production') {
    return `${githubOwner}/${githubRepo}/.github/workflows/deploy-prod.yml@*`;
  }
  if (githubEnvironment === 'test') {
    return `${githubOwner}/${githubRepo}/.github/workflows/deploy-test.yml@*`;
  }
  return `${githubOwner}/${githubRepo}/.github/workflows/deploy-dev.yml@*`;
};

export class PashashaPayCicdStack extends cdk.Stack {
  public readonly deployRoleArn: string;

  constructor(scope: Construct, id: string, props: PashashaPayCicdStackProps) {
    super(scope, id, props);

    const githubEnvironment = resolveGithubEnvironment(props.deploymentEnvironment);
    const roleName = resolveRoleName(githubEnvironment);
    const workflowRefPattern = resolveWorkflowRefPattern(
      props.githubOwner,
      props.githubRepo,
      githubEnvironment
    );
    const githubSub = `repo:${props.githubOwner}/${props.githubRepo}:environment:${githubEnvironment}`;

    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const deployRole = new iam.Role(this, 'GitHubDeployRole', {
      roleName,
      description: `GitHub Actions deployment role for the ${githubEnvironment} Pashasha environment in af-south-1.`,
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': githubSub,
        },
        StringLike: {
          'token.actions.githubusercontent.com:job_workflow_ref': workflowRefPattern,
        },
      }),
    });

    deployRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    this.deployRoleArn = deployRole.roleArn;

    new cdk.CfnOutput(this, 'GitHubEnvironmentName', {
      value: githubEnvironment,
    });

    new cdk.CfnOutput(this, 'GitHubRepository', {
      value: `${props.githubOwner}/${props.githubRepo}`,
    });

    new cdk.CfnOutput(this, 'GitHubDeployRoleName', {
      value: deployRole.roleName,
    });

    new cdk.CfnOutput(this, 'GitHubDeployRoleArn', {
      value: this.deployRoleArn,
    });

    new cdk.CfnOutput(this, 'GitHubOidcProviderArn', {
      value: provider.openIdConnectProviderArn,
    });
  }
}
