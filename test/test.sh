#!/bin/sh
# Run every check against a build. Usage: sh test.sh [index.html]
# Needs: node 18+, npm i jsdom eslint (once). Fixture CSVs: *_2026-09-01_*.csv.
set -e
F=${1:-./index.html}
D=$(dirname "$F")
cat "$D/rooms.js" "$D/pure.js" "$D/app.js" > app_under_test.js
echo "== syntax";       node --check app_under_test.js
echo "== static";       npx eslint --no-eslintrc -c eslint.config.mjs app_under_test.js 2>/dev/null || npx eslint app_under_test.js
echo "== pure/CHECK";   node edge.js "$F"
echo "== fixtures";     node run_rooms.js "$F" | grep -E "^########|^CHECK|^T[0-9?]|^ROOM|nothing flagged"
echo "== demo sweep";   node smoke.js "$F"
echo "== crash/resume"; node recover.js "$F"
echo "== legacy/demo/S9"; node extra.js "$F"
echo "== bluefy";      node bluefy.js "$F"
echo "ALL GREEN"
