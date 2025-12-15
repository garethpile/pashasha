#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

STACK_NAME="${AMPLIFY_STACK_NAME:-SecurityGuardPaymentsFrontendStack}"
BACKEND_STACK_NAME="${BACKEND_STACK_NAME:-SecurityGuardPaymentsBackendStack}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
APP_ID="${AMPLIFY_APP_ID:-}"
BRANCH_NAME="${AMPLIFY_BRANCH:-main}"
ZIP_PATH="$ROOT_DIR/infra/cdk/frontend-artifact.zip"
OUT_DIR="$ROOT_DIR/apps/frontend/out"

log() {
  printf "\033[1;34m[deploy]\033[0m %s\n" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

require_cmd npm
require_cmd aws
require_cmd curl
require_cmd python3

if [[ -z "$APP_ID" || "$APP_ID" == "None" ]]; then
  APP_ID=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppId'].OutputValue" --output text 2>/dev/null || true)
  if [[ -z "$APP_ID" || "$APP_ID" == "None" ]]; then
    log "Unable to determine Amplify App ID. Set AMPLIFY_APP_ID env var."
    exit 1
  fi
fi

BACKEND_API=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$BACKEND_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='BackendSecureApiEndpoint'].OutputValue" --output text 2>/dev/null || true)
if [[ -z "$BACKEND_API" || "$BACKEND_API" == "None" ]]; then
  BACKEND_API=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$BACKEND_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='BackendApiEndpoint'].OutputValue" --output text 2>/dev/null || true)
fi
if [[ -z "$BACKEND_API" || "$BACKEND_API" == "None" ]]; then
  log "Unable to determine backend API endpoint."
  exit 1
fi

log "Verifying backend health before deployment..."
STACK_NAME="$BACKEND_STACK_NAME" AWS_REGION="$REGION" "$ROOT_DIR/infra/scripts/backend-smoke-test.sh"

if [[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  BASE_URL="${NEXT_PUBLIC_API_BASE_URL%/}"
else
  # Default to the backend API /api path; no extra subpath.
  BASE_URL="${BACKEND_API%/}/api"
fi

log "Building frontend (branch: $BRANCH_NAME, app: $APP_ID, api: $BASE_URL)"
(cd "$ROOT_DIR" && NEXT_PUBLIC_API_BASE_URL="$BASE_URL" npm run build --workspace frontend >/dev/null)

if [[ ! -d "$OUT_DIR" ]]; then
  log "Build output missing at $OUT_DIR"
  exit 1
fi

log "Creating artifact zip at $ZIP_PATH"
rm -f "$ZIP_PATH"
(cd "$OUT_DIR" && zip -qr "$ZIP_PATH" .)

log "Requesting Amplify deployment slot..."
DEPLOYMENT_JSON=$(aws amplify create-deployment --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH_NAME")
JOB_ID=$(echo "$DEPLOYMENT_JSON" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data["jobId"])')
UPLOAD_URL=$(echo "$DEPLOYMENT_JSON" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data["zipUploadUrl"])')

log "Uploading artifact for job $JOB_ID"
curl -s -T "$ZIP_PATH" "$UPLOAD_URL" >/dev/null

log "Starting deployment..."
aws amplify start-deployment --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" >/dev/null

log "Waiting for deployment to finish..."
for _ in {1..60}; do
  STATUS=$(aws amplify get-job --region "$REGION" --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID" --query 'job.summary.status' --output text)
  log "Amplify job status: $STATUS"
  if [[ "$STATUS" == "SUCCEED" ]]; then
    log "Deployment succeeded."
    exit 0
  elif [[ "$STATUS" == "FAILED" ]]; then
    log "Deployment failed. Check Amplify console for details."
    exit 1
  fi
  sleep 5
done

log "Timed out waiting for Amplify deployment to finish."
exit 1
