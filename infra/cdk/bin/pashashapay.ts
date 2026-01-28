#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PashashaPayBackendStack } from '../lib/backend-stack';
import { PashashaPayFrontendStack } from '../lib/frontend-stack';
import { PashashaPayVoucherStack } from '../lib/voucher-stack';
import { PashashaPayFlashBackendStack } from '../lib/flash-backend-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
};

const context = app.node.tryGetContext('frontend') ?? {};
const voucherContext = app.node.tryGetContext('voucher') ?? {};
const flashContext = app.node.tryGetContext('flash') ?? {};
const authUserPoolId = app.node.tryGetContext('authUserPoolId');
const authUserPoolClientId = app.node.tryGetContext('authUserPoolClientId');

const backendStack = new PashashaPayBackendStack(app, 'PashashaPayBackendStack', {
  env,
});

const voucherStack = new PashashaPayVoucherStack(app, 'PashashaPayVoucherStack', {
  env,
  flashApiBaseUrl: voucherContext.flashApiBaseUrl,
  flashSecretsArn: voucherContext.flashSecretsArn,
});

const flashStack = new PashashaPayFlashBackendStack(app, 'PashashaPayFlashBackendStack', {
  env,
  userPoolId: authUserPoolId ?? backendStack.userPoolId,
  userPoolClientId: authUserPoolClientId ?? backendStack.userPoolClientId,
  voucherApiBaseUrl: voucherStack.apiUrl,
  guardPortalBaseUrl: flashContext.guardPortalBaseUrl,
});

new PashashaPayFrontendStack(app, 'PashashaPayFrontendStack', {
  env,
  backendEndpoint: flashStack.apiEndpoint,
  backendSecureEndpoint: flashStack.apiEndpoint,
  cognitoUserPoolId: authUserPoolId ?? backendStack.userPoolId,
  cognitoUserPoolClientId: authUserPoolClientId ?? backendStack.userPoolClientId,
  awsRegion: env.region ?? cdk.Stack.of(backendStack).region,
  repositoryOwner: context.repositoryOwner,
  repositoryName: context.repositoryName,
  githubTokenSecretArn: context.githubTokenSecretArn,
  branchName: context.branchName,
  enableSsrLoggingRolePatch: context.enableSsrLoggingRolePatch === true,
  frontendSecretsArn: flashStack.frontendSecretsArn,
});
