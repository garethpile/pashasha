#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PashashaPayBackendStack } from '../lib/backend-stack';
import { PashashaPayFrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
};

// Keep existing stack names to avoid recreating resources (e.g., Amplify/CloudFront).
const backendStack = new PashashaPayBackendStack(app, 'SecurityGuardPaymentsBackendStack', {
  env,
});

const context = app.node.tryGetContext('frontend') ?? {};

new PashashaPayFrontendStack(app, 'SecurityGuardPaymentsFrontendStack', {
  env,
  backendEndpoint: backendStack.apiEndpoint,
  backendSecureEndpoint: backendStack.secureApiEndpoint,
  cognitoUserPoolId: backendStack.userPoolId,
  cognitoUserPoolClientId: backendStack.userPoolClientId,
  awsRegion: env.region ?? cdk.Stack.of(backendStack).region,
  repositoryOwner: context.repositoryOwner,
  repositoryName: context.repositoryName,
  githubTokenSecretArn: context.githubTokenSecretArn,
  branchName: context.branchName,
});
