#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
node src/cli.js summary tests/fixtures/crewcmd-success.jsonl >/tmp/tooltrace-summary.md
grep -q "ToolTrace proof summary" /tmp/tooltrace-summary.md
node src/cli.js summary tests/fixtures/blocked-run.jsonl --format json >/tmp/tooltrace-summary.json
node -e "const fs=require('node:fs'); const timeline=JSON.parse(fs.readFileSync('/tmp/tooltrace-summary.json','utf8')); if (timeline.counts.blocking !== 1) process.exit(1)"
node examples/node-summary.mjs tests/fixtures/crewcmd-success.jsonl >/tmp/tooltrace-example.md
grep -q "Commands" /tmp/tooltrace-example.md
