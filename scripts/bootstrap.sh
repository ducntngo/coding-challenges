#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRED_NODE_MAJOR="$(cat "${REPO_ROOT}/.nvmrc")"
SKIP_NODE_VERSION_CHECK="${SKIP_NODE_VERSION_CHECK:-0}"

cd "${REPO_ROOT}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ${REQUIRED_NODE_MAJOR}.x is required but was not found."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found."
  exit 1
fi

CURRENT_NODE="$(node -p "process.versions.node")"
CURRENT_NODE_MAJOR="${CURRENT_NODE%%.*}"

if [[ "${CURRENT_NODE_MAJOR}" != "${REQUIRED_NODE_MAJOR}" ]]; then
  if [[ "${SKIP_NODE_VERSION_CHECK}" == "1" ]]; then
    echo "Warning: expected Node.js ${REQUIRED_NODE_MAJOR}.x but found ${CURRENT_NODE}."
    echo "Continuing because SKIP_NODE_VERSION_CHECK=1 was set."
  else
    echo "Expected Node.js ${REQUIRED_NODE_MAJOR}.x but found ${CURRENT_NODE}."
    echo "Use the version in .nvmrc, for example:"
    echo "  nvm install"
    echo "  nvm use"
    echo "Then rerun scripts/bootstrap.sh."
    echo "For non-authoritative local checks only, you may bypass this once with:"
    echo "  SKIP_NODE_VERSION_CHECK=1 bash scripts/bootstrap.sh"
    exit 1
  fi
fi

npm ci

echo ""
echo "Environment ready."
echo "Next commands:"
echo "  npm run typecheck"
echo "  npm test"
echo "  npm run build"
echo "  npm run dev"
