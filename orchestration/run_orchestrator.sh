#!/usr/bin/env bash
set -euo pipefail

# Source .env to load tokens (like GH_TOKEN / GITHUB_TOKEN)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

TOKEN_INJECTION=""
if [ -n "${GITHUB_TOKEN:-}" ]; then
  TOKEN_INJECTION="

<environment_injection>
Run this before using the gh cli:
export GITHUB_TOKEN=\"${GITHUB_TOKEN}\"
export GH_TOKEN=\"${GITHUB_TOKEN}\"
</environment_injection>
"
elif [ -n "${GH_TOKEN:-}" ]; then
  TOKEN_INJECTION="

<environment_injection>
Run this before using the gh cli:
export GITHUB_TOKEN=\"${GH_TOKEN}\"
export GH_TOKEN=\"${GH_TOKEN}\"
</environment_injection>
"
fi

echo "==> Pulling latest state from remote..."
git pull

echo "==> Invoking Orchestrator..."
# Use jules with explicit repo to avoid inference errors
jules new --repo bsheline/unsent "$(cat orchestration/ORCHESTRATOR.md orchestration/DESIGN.md)$TOKEN_INJECTION"
