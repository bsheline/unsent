#!/usr/bin/env bash
set -euo pipefail

echo "==> Pulling latest state from remote..."
git pull

echo "==> Invoking Orchestrator..."
# Assuming gemini CLI natively supports the @file inclusion syntax.
# If it requires a specific flag for prompts (like -p), you may use:
# gemini -p "$(cat orchestration/DESIGN.md orchestration/ORCHESTRATOR.md)"
gemini "@orchestration/ORCHESTRATOR.md @orchestration/DESIGN.md"
