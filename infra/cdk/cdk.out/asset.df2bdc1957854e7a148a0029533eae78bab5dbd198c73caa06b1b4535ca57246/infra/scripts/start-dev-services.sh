#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/docker-compose.dev.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  cat <<'COMPOSE' >"$COMPOSE_FILE"
services:
  postgres:
    image: postgres:16-alpine
    container_name: sg-payments-postgres
    environment:
      POSTGRES_DB: securityguardpayments
      POSTGRES_USER: guard_admin
      POSTGRES_PASSWORD: local_secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U guard_admin -d securityguardpayments"]
      interval: 5s
      timeout: 3s
      retries: 5
volumes:
  postgres_data:
COMPOSE
fi

docker compose -f "$COMPOSE_FILE" up -d
echo "Local infrastructure started. Postgres available on localhost:5432."