#!/usr/bin/env bash
# Usage:
#   RECON_DAYS=7 API_BASE="https://d219w61biha52r.cloudfront.net" ./scripts/reconcile.sh
#
# Optional: Have the script obtain a bearer token first using Eclipse credentials:
#   TENANT_IDENTITY="user@example.com" TENANT_PASSWORD="password" \
#   RECON_DAYS=7 API_BASE="https://d219w61biha52r.cloudfront.net" ./scripts/reconcile.sh
# Or fetch credentials from AWS Secrets Manager by setting ECLIPSE_SECRET_ARN (expects keys
# TENANT_IDENTITY/TENANT_PASSWORD or tenantIdentity/tenantPassword):
#   ECLIPSE_SECRET_ARN="arn:aws:secretsmanager:...:secret:your/secret" ./scripts/reconcile.sh
#
# If TENANT_IDENTITY and TENANT_PASSWORD are omitted, the script expects BEARER to already be set.

set -euo pipefail

API_BASE="${API_BASE:-https://d219w61biha52r.cloudfront.net}"
RECON_DAYS="${RECON_DAYS:-7}"
LOGIN_URL="${LOGIN_URL:-https://eclipse-java-sandbox.ukheshe.rocks/eclipse-conductor/rest/v1/authentication/login}"

load_from_secret() {
  if [[ -z "${ECLIPSE_SECRET_ARN:-}" ]]; then
    return 1
  fi
  echo "Loading credentials from Secrets Manager: ${ECLIPSE_SECRET_ARN}" 1>&2
  local secret_json
  secret_json=$(aws secretsmanager get-secret-value --secret-id "${ECLIPSE_SECRET_ARN}" --query 'SecretString' --output text)
  TENANT_IDENTITY=${TENANT_IDENTITY:-$(echo "$secret_json" | jq -r '.TENANT_IDENTITY // .ECLIPSE_TENANT_IDENTITY // .tenantIdentity // .identity // empty')}
  TENANT_PASSWORD=${TENANT_PASSWORD:-$(echo "$secret_json" | jq -r '.TENANT_PASSWORD // .ECLIPSE_TENANT_PASSWORD // .tenantPassword // .password // empty')}
}

bearer_from_login() {
  if [[ -z "${TENANT_IDENTITY:-}" || -z "${TENANT_PASSWORD:-}" ]]; then
    return 1
  fi
  echo "Requesting bearer token from ${LOGIN_URL}..." 1>&2
  local resp
  resp=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"${TENANT_IDENTITY}\",\"password\":\"${TENANT_PASSWORD}\"}" \
    "${LOGIN_URL}")
  echo "$resp" | jq -r '.headerValue' | sed 's/^Bearer //'
}

if [[ -z "${BEARER:-}" ]]; then
  load_from_secret || true
  if BEARER=$(bearer_from_login); then
    export BEARER
  else
    echo "Error: set BEARER or TENANT_IDENTITY and TENANT_PASSWORD (or ECLIPSE_SECRET_ARN with those keys)" 1>&2
    exit 1
  fi
fi

echo "Running reconcile for last ${RECON_DAYS} days against ${API_BASE} ..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${BEARER}" \
  -d "{\"days\":${RECON_DAYS}}" \
  "${API_BASE%/}/api/payments/reconcile" | jq .
