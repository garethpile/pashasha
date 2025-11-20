#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

STACK_NAME="${AMPLIFY_STACK_NAME:-SecurityGuardPaymentsFrontendStack}"
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

log "Building frontend (branch: $BRANCH_NAME, app: $APP_ID)"
(cd "$ROOT_DIR" && npm run build --workspace frontend >/dev/null)

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
