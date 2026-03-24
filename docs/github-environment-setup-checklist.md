# GitHub Environment Setup Checklist

Use this checklist after the AWS CI/CD bootstrap stack has been deployed.

## Repository

- Confirm the repository is `garethpile/pashasha`.
- Confirm GitHub Actions is enabled for the repository.
- Confirm the workflow files exist:
  - [`.github/workflows/ci.yml`](/Users/pileg/development/pashasha/.github/workflows/ci.yml)
  - [`.github/workflows/deploy-dev.yml`](/Users/pileg/development/pashasha/.github/workflows/deploy-dev.yml)
  - [`.github/workflows/deploy-prod.yml`](/Users/pileg/development/pashasha/.github/workflows/deploy-prod.yml)

## Copy/Paste Values

### `dev` environment variables

```text
AWS_DEPLOY_ROLE_ARN=arn:aws:iam::701158128147:role/GitHubActionsPashashaDevDeployRole
FRONTEND_HOSTED_ZONE_DOMAIN_NAME=pashasha.com
FRONTEND_BRANCH_NAME=main
FRONTEND_REPOSITORY_OWNER=garethpile
FRONTEND_REPOSITORY_NAME=pashasha
FRONTEND_ENABLE_SSR_LOGGING_ROLE_PATCH=false
```

Optional only if required by your frontend metadata flow:

```text
FRONTEND_GITHUB_TOKEN_SECRET_ARN=<set-if-required>
```

### `production` environment variables

```text
AWS_DEPLOY_ROLE_ARN=arn:aws:iam::732439976770:role/GitHubActionsPashashaProdDeployRole
FRONTEND_HOSTED_ZONE_DOMAIN_NAME=pashasha.com
FRONTEND_BRANCH_NAME=main
FRONTEND_REPOSITORY_OWNER=garethpile
FRONTEND_REPOSITORY_NAME=pashasha
FRONTEND_ENABLE_SSR_LOGGING_ROLE_PATCH=false
```

Optional only if required by your frontend metadata flow:

```text
FRONTEND_GITHUB_TOKEN_SECRET_ARN=<set-if-required>
```

## GitHub Environment: `dev`

Create the GitHub Environment:

- Name: `dev`

Add environment variables:

- `AWS_DEPLOY_ROLE_ARN`
  - value: `arn:aws:iam::701158128147:role/GitHubActionsPashashaDevDeployRole`
- `FRONTEND_HOSTED_ZONE_DOMAIN_NAME`
  - example: `pashasha.com`
- `FRONTEND_BRANCH_NAME`
  - example: `main`
- `FRONTEND_REPOSITORY_OWNER`
  - value: `garethpile`
- `FRONTEND_REPOSITORY_NAME`
  - value: `pashasha`
- `FRONTEND_GITHUB_TOKEN_SECRET_ARN`
  - set only if your frontend deployment metadata flow requires it
- `FRONTEND_ENABLE_SSR_LOGGING_ROLE_PATCH`
  - set to `true` only if explicitly needed

Recommended environment protection:

- no required reviewers

## GitHub Environment: `production`

Create the GitHub Environment:

- Name: `production`

Add environment variables:

- `AWS_DEPLOY_ROLE_ARN`
  - value: `arn:aws:iam::732439976770:role/GitHubActionsPashashaProdDeployRole`
- `FRONTEND_HOSTED_ZONE_DOMAIN_NAME`
  - example: `pashasha.com`
- `FRONTEND_BRANCH_NAME`
  - example: `main`
- `FRONTEND_REPOSITORY_OWNER`
  - value: `garethpile`
- `FRONTEND_REPOSITORY_NAME`
  - value: `pashasha`
- `FRONTEND_GITHUB_TOKEN_SECRET_ARN`
  - set only if your frontend deployment metadata flow requires it
- `FRONTEND_ENABLE_SSR_LOGGING_ROLE_PATCH`
  - set to `true` only if explicitly needed

Required environment protection:

- required reviewers enabled
- restrict deployment to trusted maintainers

## Optional Future Environment: `test`

This repository has a manual deployment script for test, but no GitHub Actions test deployment workflow yet.

If a test lane is added later, use:

- environment name: `test`
- deploy role ARN:
  - `arn:aws:iam::119045522978:role/GitHubActionsPashashaTestDeployRole`

## AWS Verification

Verify the bootstrap stacks exist:

- Dev account `701158128147`
  - stack: `PashashaPayCicdStack`
- Production account `732439976770`
  - stack: `PashashaPayCicdStack`

Verify stack outputs:

- `GitHubDeployRoleArn`
- `GitHubDeployRoleName`
- `GitHubEnvironmentName`
- `GitHubOidcProviderArn`
- `GitHubRepository`

## Smoke Check

After GitHub Environment setup:

1. Merge a small change to `main`.
2. Confirm `CI` completes successfully.
3. Confirm `Deploy Dev` starts automatically.
4. Confirm `Deploy Prod` waits on the `production` environment approval gate.
5. Approve production and confirm deployment completes.
