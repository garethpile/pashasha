#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CDK_DIR="$ROOT_DIR/infra/cdk"

DEFAULT_AWS_PROFILE="aws-af-south-1-test"
AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-$AWS_REGION}"
CDK_DEFAULT_REGION="${CDK_DEFAULT_REGION:-$AWS_REGION}"
APP_ENV="${APP_ENV:-test}"

export AWS_REGION
export AWS_DEFAULT_REGION
export CDK_DEFAULT_REGION
export APP_ENV

FRONTEND_STACK_NAME="${FRONTEND_STACK_NAME:-PashashaPayFrontendTestStack}"

ACTIVE_AWS_AUTH="ambient credentials"
if [[ -n "${AWS_PROFILE:-}" ]]; then
  export AWS_PROFILE
  ACTIVE_AWS_AUTH="profile $AWS_PROFILE"
elif [[ -z "${AWS_ACCESS_KEY_ID:-}" && -z "${AWS_WEB_IDENTITY_TOKEN_FILE:-}" ]]; then
  export AWS_PROFILE="$DEFAULT_AWS_PROFILE"
  ACTIVE_AWS_AUTH="profile $AWS_PROFILE"
fi

log() {
  printf "\033[1;34m[deploy-test]\033[0m %s\n" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf "Missing required command: %s\n" "$1" >&2
    exit 1
  fi
}

stack_output() {
  local stack_name="$1"
  local output_key="$2"
  aws cloudformation describe-stacks \
    --region "$AWS_REGION" \
    --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
    --output text
}

require_cmd aws
require_cmd npm
require_cmd npx

ensure_frontend_export() {
  log "Preparing frontend export for CDK asset packaging"
  (
    cd "$ROOT_DIR"
    NEXT_PUBLIC_AWS_REGION="$AWS_REGION" \
    npm run build --workspace frontend
  )
}

log "Using $ACTIVE_AWS_AUTH in region $AWS_REGION"
aws sts get-caller-identity >/dev/null

log "Building contracts workspace"
(cd "$ROOT_DIR" && npm run build --workspace @pashashapay/contracts)

ensure_frontend_export

log "Building CDK app"
(cd "$CDK_DIR" && npm run build)

log "Deploying platform stacks"
(cd "$CDK_DIR" && npx cdk deploy --require-approval never \
  PashashaPayPaymentStack \
  PashashaPayNotificationsStack \
  PashashaPayVoucherStack \
  PashashaPayCoreBackendStack)

CORE_API_URL="$(stack_output PashashaPayCoreBackendStack CoreApiUrl)"
VOUCHER_API_URL="$(stack_output PashashaPayVoucherStack VoucherApiUrl)"
COGNITO_USER_POOL_ID="$(stack_output PashashaPayCoreBackendStack CoreUserPoolId)"
COGNITO_CLIENT_ID="$(stack_output PashashaPayCoreBackendStack CoreUserPoolClientId)"

log "Building frontend against deployed af-south-1 endpoints"
(
  cd "$ROOT_DIR"
  NEXT_PUBLIC_API_BASE_URL="${CORE_API_URL%/}" \
  NEXT_PUBLIC_VOUCHER_API_BASE_URL="${VOUCHER_API_URL%/}" \
  NEXT_PUBLIC_COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
  NEXT_PUBLIC_COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
  NEXT_PUBLIC_AWS_REGION="$AWS_REGION" \
  npm run build --workspace frontend
)

log "Deploying frontend stack $FRONTEND_STACK_NAME"
(cd "$CDK_DIR" && npx cdk deploy --require-approval never "$FRONTEND_STACK_NAME")

FRONTEND_URL="$(stack_output "$FRONTEND_STACK_NAME" FrontendUrl)"
FRONTEND_DISTRIBUTION_DOMAIN_NAME="$(stack_output "$FRONTEND_STACK_NAME" FrontendDistributionDomainName)"

log "Deployment complete"
printf "\nCore API: %s\n" "$CORE_API_URL"
printf "Voucher API: %s\n" "$VOUCHER_API_URL"
printf "Frontend URL: %s\n" "$FRONTEND_URL"
printf "CloudFront Domain: %s\n" "$FRONTEND_DISTRIBUTION_DOMAIN_NAME"

if [[ -n "${FRONTEND_HOSTED_ZONE_DOMAIN_NAME:-}" ]]; then
  printf "Test DNS: https://test.%s\n" "$FRONTEND_HOSTED_ZONE_DOMAIN_NAME"
  printf "WWW Test DNS: https://www.test.%s\n" "$FRONTEND_HOSTED_ZONE_DOMAIN_NAME"
fi
