#!/usr/bin/env bash
# The full local gate — same thing the pre-push hook runs. No hosted CI.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── format check ──"
npx prettier --check .
echo "── lint ──"
npm run lint
echo "── typecheck ──"
npm run typecheck
echo "── tests ──"
npx vitest run
echo "── build ──"
npm run build
echo "✓ verify ok"
