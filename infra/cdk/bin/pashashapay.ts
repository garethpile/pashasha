#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PashashaPayBackendStack } from '../lib/backend-stack';
import { PashashaPayFrontendStack } from '../lib/frontend-stack';
import { PashashaPayVoucherStack } from '../lib/voucher-stack';
import { PashashaPayFlashBackendStack } from '../lib/flash-backend-stack';
import { applySolutionTags } from '../lib/tags';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
};
const environment = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'unknown';
const costCenter = process.env.COST_CENTER;

const context = app.node.tryGetContext('frontend') ?? {};
const voucherContext = app.node.tryGetContext('voucher') ?? {};
const flashContext = app.node.tryGetContext('flash') ?? {};
const authUserPoolId = app.node.tryGetContext('authUserPoolId');
const authUserPoolClientId = app.node.tryGetContext('authUserPoolClientId');

const backendStack = new PashashaPayBackendStack(app, 'PashashaPayBackendStack', {
  env,
});
applySolutionTags(backendStack, {
  solution: 'Pashasha',
  component: 'core-backend',
  environment,
  repo: 'pashasha',
  serviceGroup: 'payments',
  costCenter,
  lifecycle: 'nonprod',
});

const voucherStack = new PashashaPayVoucherStack(app, 'PashashaPayVoucherStack', {
  env,
  flashApiBaseUrl: voucherContext.flashApiBaseUrl,
  flashSecretsArn: voucherContext.flashSecretsArn,
});
applySolutionTags(voucherStack, {
  solution: 'Pashasha',
  component: 'voucher',
  environment,
  repo: 'pashasha',
  serviceGroup: 'payouts',
  costCenter,
  lifecycle: 'nonprod',
});

const flashStack = new PashashaPayFlashBackendStack(app, 'PashashaPayFlashBackendStack', {
  env,
  userPoolId: authUserPoolId ?? backendStack.userPoolId,
  userPoolClientId: authUserPoolClientId ?? backendStack.userPoolClientId,
  voucherApiBaseUrl: voucherStack.apiUrl,
  guardPortalBaseUrl: flashContext.guardPortalBaseUrl,
});
applySolutionTags(flashStack, {
  solution: 'Pashasha',
  component: 'flash-legacy',
  environment,
  repo: 'pashasha',
  serviceGroup: 'legacy-payouts',
  costCenter,
  lifecycle: 'sunset-candidate',
  paymentEngine: 'flash',
});

const frontendStack = new PashashaPayFrontendStack(app, 'PashashaPayFrontendStack', {
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
applySolutionTags(frontendStack, {
  solution: 'Pashasha',
  component: 'frontend',
  environment,
  repo: 'pashasha',
  serviceGroup: 'ui',
  costCenter,
  lifecycle: 'active',
});
