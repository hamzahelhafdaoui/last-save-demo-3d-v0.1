#!/usr/bin/env bash
# Preserve this experiment without ever publishing to the main game.
set -euo pipefail
cd "$(dirname "$0")/.."
test "$(git branch --show-current)" = 'experiment/amazigh' || { echo 'Refusing: use the experiment/amazigh branch.' >&2; exit 1; }
npm test
npm run build
git add -A .
if ! git diff --cached --quiet; then git commit -m "${1:-Save verified AMAN development checkpoint}"; fi
git push origin HEAD:refs/heads/experiment/amazigh
mkdir -p ../deliverables
git archive --format=zip --prefix=last-save-aman/ -o ../deliverables/last-save-aman-source.zip HEAD
echo 'Source preserved. Deploy this SHA ONLY to last-save-aman (prj_mzibNFHjMGhtnE9MEDrQ5bUXmelx), then verify the permanent public URL. Never deploy this branch to the main game project.'
