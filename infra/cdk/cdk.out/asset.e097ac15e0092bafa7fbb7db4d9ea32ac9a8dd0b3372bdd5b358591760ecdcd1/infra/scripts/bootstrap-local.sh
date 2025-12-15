#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log() {
  printf "\033[1;34m[bootstrap]\033[0m %s\n" "$*"
}

ensure_binary() {
  local bin="$1"
  if ! command -v "$bin" >/dev/null 2>&1; then
    log "Missing dependency: $bin"
    exit 1
  fi
}

log "Ensuring required CLI tools are installed"
ensure_binary node
ensure_binary npm
ensure_binary docker

if command -v aws >/dev/null 2>&1; then
  aws sts get-caller-identity >/dev/null 2>&1 || {
    log "AWS CLI configured but not authenticated."
    log "Run 'aws configure sso' or 'aws configure' as appropriate."
  }
else
  log "AWS CLI not found; install from https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
fi

log "Copying environment templates"
for file in ".env.example" ".env"; do
  src="$ROOT_DIR/$file"
  if [[ -f "$src.local" && ! -f "$src" ]]; then
    cp "$src.local" "$src"
  fi
done

log "bootstrap-local complete ✅"