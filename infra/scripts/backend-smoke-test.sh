#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-PashashaPayCoreBackendStack}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-af-south-1}}"
ENDPOINT="${BACKEND_ENDPOINT:-}"
HEALTH_PATH="${HEALTH_PATH:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

if [[ -z "$ENDPOINT" ]]; then
  log "Fetching backend endpoint from stack '$STACK_NAME' in region '$REGION'..."
  ENDPOINT="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='CoreApiUrl'].OutputValue" \
    --output text 2>/dev/null || true)"

  if [[ -z "$ENDPOINT" || "$ENDPOINT" == "None" ]]; then
    ENDPOINT="$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query "Stacks[0].Outputs[?OutputKey=='BackendApiEndpoint'].OutputValue" \
      --output text 2>/dev/null || true)"
  fi

  if [[ -z "$ENDPOINT" || "$ENDPOINT" == "None" ]]; then
    ENDPOINT="$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query "Stacks[0].Outputs[?OutputKey=='BackendSecureApiEndpoint'].OutputValue" \
      --output text 2>/dev/null || true)"
  fi

  if [[ -z "$ENDPOINT" || "$ENDPOINT" == "None" ]]; then
    echo "Unable to resolve CoreApiUrl or legacy backend outputs; set BACKEND_ENDPOINT manually." >&2
    exit 1
  fi
fi

# Ensure we have a clean URL (strip trailing slash)
ENDPOINT="${ENDPOINT%/}"
if [[ -z "$HEALTH_PATH" ]]; then
  if [[ "$STACK_NAME" == "PashashaPayCoreBackendStack" ]]; then
    HEALTH_PATH="/api/health"
  else
    HEALTH_PATH="/health"
  fi
fi
TARGET="${ENDPOINT}${HEALTH_PATH}"

log "Running smoke test against ${TARGET}"

HTTP_STATUS="$(curl -sS -m 15 -w '%{http_code}' -o /tmp/pashasha-smoke-response "$TARGET")"
BODY="$(cat /tmp/pashasha-smoke-response)"
rm -f /tmp/pashasha-smoke-response

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "Smoke test failed: HTTP ${HTTP_STATUS}" >&2
  echo "Response body: ${BODY}" >&2
  exit 2
fi

if ! echo "$BODY" | grep -q '"status":"ok"'; then
  echo "Smoke test failed: unexpected body '${BODY}'" >&2
  exit 3
fi

log "Smoke test succeeded."
