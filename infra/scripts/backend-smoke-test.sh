#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-SecurityGuardPaymentsBackendStack}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
ENDPOINT="${BACKEND_ENDPOINT:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

if [[ -z "$ENDPOINT" ]]; then
  log "Fetching backend endpoint from stack '$STACK_NAME' in region '$REGION'..."
  ENDPOINT="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='BackendApiEndpoint'].OutputValue" \
    --output text 2>/dev/null || true)"

  if [[ -z "$ENDPOINT" || "$ENDPOINT" == "None" ]]; then
    echo "Unable to resolve BackendApiEndpoint output; set BACKEND_ENDPOINT manually." >&2
    exit 1
  fi
fi

# Ensure we have a clean URL (strip trailing slash)
ENDPOINT="${ENDPOINT%/}"
TARGET="${ENDPOINT}/health"

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
