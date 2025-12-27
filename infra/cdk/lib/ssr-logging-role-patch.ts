import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Custom resource to patch SSR Logging Role for Amplify with secret access.
 */
export class AmplifySSRLoggingRolePatch extends Construct {
  constructor(scope: Construct, id: string, props: { secretArn: string }) {
    super(scope, id);

    // Patch the SSR Logging Role if it exists
    const role = cdk.aws_iam.Role.fromRoleName(
      this,
      'SSRLoggingRole',
      'AmplifySSRLoggingRole' // This must match the actual role name in your account
    );

    role.addToPrincipalPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.secretArn],
      })
    );
  }
}
