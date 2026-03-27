#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PashashaPayCicdStack } from '../lib/cicd-stack';
import { PashashaPayCoreBackendStack } from '../lib/core-backend-stack';
import { PashashaPayFrontendStack } from '../lib/frontend-stack';
import { PashashaPayNotificationsStack } from '../lib/notifications-stack';
import { PashashaPayPaymentStack } from '../lib/payment-stack';
import { PashashaPayVoucherStack } from '../lib/voucher-stack';
import { applySolutionTags } from '../lib/tags';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'af-south-1',
};
const environment = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'unknown';
const costCenter = process.env.COST_CENTER;
const githubOwner = process.env.CICD_GITHUB_OWNER ?? 'garethpile';
const githubRepo = process.env.CICD_GITHUB_REPO ?? 'pashasha';

const frontendContext = app.node.tryGetContext('frontend') ?? {};
const frontendConfig = {
  ...frontendContext,
  repositoryOwner: process.env.FRONTEND_REPOSITORY_OWNER ?? frontendContext.repositoryOwner,
  repositoryName: process.env.FRONTEND_REPOSITORY_NAME ?? frontendContext.repositoryName,
  githubTokenSecretArn:
    process.env.FRONTEND_GITHUB_TOKEN_SECRET_ARN ?? frontendContext.githubTokenSecretArn,
  branchName: process.env.FRONTEND_BRANCH_NAME ?? frontendContext.branchName,
  hostedZoneDomainName:
    process.env.FRONTEND_HOSTED_ZONE_DOMAIN_NAME ?? frontendContext.hostedZoneDomainName,
  manageDnsRecords:
    process.env.FRONTEND_MANAGE_DNS_RECORDS === 'true'
      ? true
      : process.env.FRONTEND_MANAGE_DNS_RECORDS === 'false'
        ? false
        : frontendContext.manageDnsRecords,
  enableSsrLoggingRolePatch:
    process.env.FRONTEND_ENABLE_SSR_LOGGING_ROLE_PATCH === 'true'
      ? true
      : frontendContext.enableSsrLoggingRolePatch,
};

const cicdStack = new PashashaPayCicdStack(app, 'PashashaPayCicdStack', {
  env,
  deploymentEnvironment: environment,
  githubOwner,
  githubRepo,
});
applySolutionTags(cicdStack, {
  solution: 'Pashasha',
  component: 'cicd',
  environment,
  repo: 'pashasha',
  serviceGroup: 'platform',
  costCenter,
  lifecycle: 'active',
});

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
  deploymentEnvironment: environment,
  cognitoUserPoolId: coreBackendStack.userPoolId,
  cognitoUserPoolClientId: coreBackendStack.userPoolClientId,
  awsRegion: env.region ?? cdk.Stack.of(coreBackendStack).region,
  repositoryOwner: frontendConfig.repositoryOwner,
  repositoryName: frontendConfig.repositoryName,
  githubTokenSecretArn: frontendConfig.githubTokenSecretArn,
  branchName: frontendConfig.branchName,
  manageDnsRecords: frontendConfig.manageDnsRecords === true,
  enableSsrLoggingRolePatch: frontendConfig.enableSsrLoggingRolePatch === true,
  hostedZoneDomainName: frontendConfig.hostedZoneDomainName,
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
