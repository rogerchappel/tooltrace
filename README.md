# tooltrace

A local-first activity timeline and proof-of-work layer for agent apps. ToolTrace turns raw runtime/tool events into a grouped review timeline, copyable proof summary, and embeddable React UI.

## Install

```sh
npm install tooltrace
```

React is an optional peer dependency for `tooltrace/react`.

## Core usage

```js
import { createTimeline, createProofSummary } from 'tooltrace';

const timeline = createTimeline(events, { includeRaw: false });
console.log(createProofSummary(timeline));
```

Supported proof categories include messages, commands, tool calls, file changes, checks, approvals, errors/retries, blockers, PR/commit links, and completion proof.

## React usage

```tsx
import { ToolTrace } from 'tooltrace/react';

<ToolTrace
  events={events}
  mode="review"
  showProofSummary
  onOpenFile={(path) => openInEditor(path)}
/>;
```

The component supports compact, grouped, and review/proof presentation via CSS classes and accessible keyboard-focusable groups/events.

## CLI

```sh
tooltrace summary ./demo/crewcmd-run.jsonl
tooltrace render ./demo/crewcmd-run.jsonl --out TOOLTRACE.md
```

The CLI accepts generic JSONL: one JSON event object per line.

## Adapters

```js
import { agentPulseToToolTraceEvents, jsonlToToolTraceEvents } from 'tooltrace';

const fromAgentPulse = agentPulseToToolTraceEvents(agentPulseEvents);
const fromJsonl = jsonlToToolTraceEvents(jsonlText);
```

Adapters preserve source metadata, apply safe defaults, and redact common credentials/tokens before generating UI-ready proof.

## Demo

`demo/crewcmd-run.jsonl` simulates a CrewCmd-style task with a failed check, retry, file change, approval, commit, PR link, and final proof summary.

## Documentation

- [Proof timeline information architecture](docs/proof-information-architecture.md)
- [Integration recipes](docs/integration-recipes.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs package checks when present and skips optional `agent-qc` if it is not installed.

## Security

ToolTrace is local-first and does not perform network calls in core. Use custom redaction patterns for application-specific sensitive data.

## License

MIT
