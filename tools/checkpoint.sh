#!/usr/bin/env bash
# Run from this checkout. The linked Vercel project builds main automatically.
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run build
git add -A .
if ! git diff --cached --quiet; then
  git commit -m "${1:-Save verified LAST SAVE development checkpoint}"
fi
git push origin main
mkdir -p ../deliverables
git archive --format=zip --prefix=last-save-demo-3d/ -o ../deliverables/last-save-demo-3d-source.zip HEAD
echo 'Source pushed. Verify the matching Vercel deployment SHA and public game URL before reporting completion.'
