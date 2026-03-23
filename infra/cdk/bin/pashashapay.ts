#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PashashaPayCoreBackendStack } from '../lib/core-backend-stack';
import { PashashaPayFrontendStack } from '../lib/frontend-stack';
import { PashashaPayNotificationsStack } from '../lib/notifications-stack';
import { PashashaPayPaymentStack } from '../lib/payment-stack';
import { PashashaPayVoucherStack } from '../lib/voucher-stack';
import { applySolutionTags } from '../lib/tags';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
};
const environment = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'unknown';
const costCenter = process.env.COST_CENTER;

const context = app.node.tryGetContext('frontend') ?? {};

const paymentStack = new PashashaPayPaymentStack(app, 'PashashaPayPaymentStack', {
  env,
});
applySolutionTags(paymentStack, {
  solution: 'Pashasha',
  component: 'payment',
  environment,
  repo: 'pashasha',
  serviceGroup: 'payments',
  costCenter,
  paymentEngine: 'ozow',
  lifecycle: 'active',
});

const notificationsStack = new PashashaPayNotificationsStack(app, 'PashashaPayNotificationsStack', {
  env,
});
applySolutionTags(notificationsStack, {
  solution: 'Pashasha',
  component: 'notifications',
  environment,
  repo: 'pashasha',
  serviceGroup: 'comms',
  costCenter,
  lifecycle: 'active',
});

const voucherStack = new PashashaPayVoucherStack(app, 'PashashaPayVoucherStack', {
  env,
});
applySolutionTags(voucherStack, {
  solution: 'Pashasha',
  component: 'voucher',
  environment,
  repo: 'pashasha',
  serviceGroup: 'payouts',
  costCenter,
  lifecycle: 'active',
});

const coreBackendStack = new PashashaPayCoreBackendStack(app, 'PashashaPayCoreBackendStack', {
  env,
  paymentApiUrl: paymentStack.apiUrl,
  voucherApiUrl: voucherStack.apiUrl,
  notificationsApiUrl: notificationsStack.apiUrl,
  paymentCoreApiKeySecretArn: paymentStack.coreApiKeySecretArn,
  paymentToCoreApiKeySecretArn: paymentStack.paymentToCoreApiKeySecretArn,
  voucherCoreApiKeySecretArn: voucherStack.coreApiKeySecretArn,
  notificationsCoreApiKeySecretArn: notificationsStack.coreApiKeySecretArn,
});
applySolutionTags(coreBackendStack, {
  solution: 'Pashasha',
  component: 'core-backend',
  environment,
  repo: 'pashasha',
  serviceGroup: 'core',
  costCenter,
  lifecycle: 'active',
});
coreBackendStack.addDependency(paymentStack);
coreBackendStack.addDependency(voucherStack);
coreBackendStack.addDependency(notificationsStack);

const frontendStack = new PashashaPayFrontendStack(app, 'PashashaPayFrontendStack', {
  env,
  backendEndpoint: coreBackendStack.apiUrl,
  backendSecureEndpoint: coreBackendStack.apiUrl,
  cognitoUserPoolId: coreBackendStack.userPoolId,
  cognitoUserPoolClientId: coreBackendStack.userPoolClientId,
  awsRegion: env.region ?? cdk.Stack.of(coreBackendStack).region,
  repositoryOwner: context.repositoryOwner,
  repositoryName: context.repositoryName,
  githubTokenSecretArn: context.githubTokenSecretArn,
  branchName: context.branchName,
  enableSsrLoggingRolePatch: context.enableSsrLoggingRolePatch === true,
  hostedZoneDomainName: context.hostedZoneDomainName,
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
