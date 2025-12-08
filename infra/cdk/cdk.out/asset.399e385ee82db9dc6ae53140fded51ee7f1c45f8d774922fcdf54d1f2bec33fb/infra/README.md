# Infrastructure & Environment Overview

This repository targets AWS as the primary deployment environment, with all services provisioned inside a dedicated VPC. The long-term plan is to codify infrastructure with AWS CDK (TypeScript) stored under `infra/cdk`. Until then, the following baseline assumptions apply:

- **Networking**: VPC with two public and two private subnets spanning at least two AZs.
- **Compute**:
  - ECS Fargate cluster for the NestJS API and background workers.
  - AWS Amplify Hosting for the Next.js frontend (alternatively CloudFront + S3 for static export).
- **Data Stores**:
  - Amazon RDS PostgreSQL (Multi-AZ).
  - Amazon S3 for guard media and QR code assets.
  - Amazon DynamoDB table for idempotency keys and rate limiting.
- **Security**:
  - AWS WAF on CloudFront/ALB.
  - Secrets Manager for Paystack keys, DB credentials, Cognito secrets.
  - GuardDuty and Security Hub enabled at the account level.
- **Observability**:
  - CloudWatch metrics/log groups per service.
  - OpenTelemetry collector sidecar exporting traces to the preferred APM vendor.

## Local Environment

Use the scripts under `infra/scripts` to bootstrap developer machines. They install required tooling, generate `.env` files, and run database containers where necessary.

1. `./infra/scripts/bootstrap-local.sh` – installs CLI prerequisites, copies env templates, and verifies nodenv + AWS CLI availability.
2. `./infra/scripts/start-dev-services.sh` – starts local Postgres + Redis containers for running the backend without AWS dependencies.

> **Note**: The backend expects Paystack secrets, Cognito IDs, and database credentials in `.env` files. After running the bootstrap script, edit the generated `.env` files with real values or sandbox keys before launching services.

## Next Steps

- Implement CDK constructs for VPC, ECS services, and RDS.
- Add GitHub Actions pipeline stage to run `cdk synth` and `cdk diff` on pull requests.
- Introduce secret rotation via AWS Secrets Manager for Paystack keys and database credentials.
