# ToolTrace integration recipes

ToolTrace is a local-first proof layer for agent apps. It is intentionally smaller than observability: feed it runtime events and it returns a readable timeline plus a copyable proof summary.

## React in under an hour

```tsx
import { ToolTrace } from 'tooltrace/react';

export function ReviewPane({ runEvents }) {
  return <ToolTrace events={runEvents} mode="review" showProofSummary />;
}
```

Events can be raw JSON objects. ToolTrace normalises common aliases such as `exec`, `tool_call`, `approval_request`, `test`, `commit`, and `pull_request`.

## Core normalisation

```js
import { createTimeline, createProofSummary } from 'tooltrace';

const timeline = createTimeline(events, { includeRaw: false });
const summary = createProofSummary(timeline, { title: 'PR proof' });
```

Use `includeRaw: false` for UI handoff artifacts when private provider payloads are not needed.

## Generic JSONL format

Each line is one event object:

```jsonl
{"timestamp":"2026-05-01T02:12:00Z","type":"exec","command":"npm test","status":"passed"}
{"timestamp":"2026-05-01T02:13:00Z","type":"file","filePath":"src/index.js","operation":"modified"}
```

Render it locally:

```bash
npx tooltrace summary ./run.jsonl
npx tooltrace render ./run.jsonl --out TOOLTRACE.md
```

## AgentPulse adapter

```js
import { agentPulseToToolTraceEvents } from 'tooltrace';

const events = agentPulseToToolTraceEvents(agentPulseEvents);
```

Known AgentPulse-like types are mapped with safe defaults: `exec/process/command` to commands, `browser/tool` to tools, `approval` to approval events, `check/test/build/lint` to checks, and `commit/pull/pr` to review artifacts.

## Privacy and redaction

ToolTrace redacts common credential and token shapes in titles and bodies, tracks redaction reasons, and truncates oversized text. For stricter apps, pass custom redaction patterns:

```js
createTimeline(events, {
  patterns: [{ reason: 'customer_data', pattern: /ACME-[0-9]+/g, replacement: '[redacted:customer_data]' }],
});
```

## CrewCmd-style review recipe

1. Capture plan, commands, tool calls, file changes, checks, approvals, PR/commit links, blockers, and completion proof as JSONL.
2. Show `<ToolTrace mode="review" showProofSummary />` in the task drawer.
3. Paste `createProofSummary()` into the PR or completion report.
4. Keep raw logs behind a disclosure; default the human view to grouped proof.

## Why this is not raw logs

Raw logs answer “what bytes happened?” ToolTrace answers review questions: what changed, what passed, what failed and recovered, what needs approval, and what evidence should be checked before merge.
