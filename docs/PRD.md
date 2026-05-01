# tooltrace

Status: ready
Decision: build now

## Scorecard

Total: 86/100
Band: build now
Last scored: 2026-05-01
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 18/20 | Users trust agent interfaces more when they can see what the agent is doing, but raw logs are ugly and overwhelming. |
| Demand signal | 17/20 | Strong internal demand from CrewCmd proof-of-work/review flows and broader agent UI interest. |
| V1 buildability | 18/20 | A polished event timeline component with adapters and fixtures is feasible. |
| Differentiation | 13/15 | More focused and beautiful than generic logs; less broad than observability platforms. |
| Agentic workflow leverage | 15/15 | Directly improves supervision, proof capture, PR review, and handoff quality. |
| Distribution potential | 5/10 | Screenshots and replay demos are compelling, though less flashy than voice/visual presence. |

## Pitch

A beautiful embeddable tool-call and agent-activity timeline for agent apps, turning raw runtime logs into human-readable proof-of-work.

## Why It Matters

Agent interfaces need trust. A glowing orb tells you the agent is alive; a tool timeline tells you what it actually did. Builders currently choose between hiding the work or dumping raw logs. Neither is good enough for serious agent teams.

`tooltrace` gives CrewCmd and other agent apps a reusable review layer: tool calls, files touched, commands run, tests passed, approvals requested, errors, retries, and final proof.

## Qualification

### Pub Test

“Embed a polished activity timeline that shows exactly what your agent did — without making users read raw logs.”

### Competitors / Adjacent Tools

- LangSmith / observability products — validate demand for agent traces, but are cloud/platform oriented and developer-observability focused.
- Raw terminal logs and session transcripts — available everywhere but poor for product UIs and human review.
- OpenTelemetry trace viewers — powerful but too infrastructure-heavy for agent workflow proof and approvals.
- Bespoke timelines inside individual agent apps — useful but not portable.

### Star / Demand Signal

The growth of agent orchestration, code agents, and review workflows creates a trust gap. Roger’s work repeatedly needs proof: commits, tests, PRs, screenshots, commands, and blockers. A reusable component turns that repeated need into product infrastructure.

### Real Problem

CrewCmd needs to answer:

- What is this agent doing right now?
- Which files did it touch?
- Which commands did it run?
- What failed and what recovered?
- What proof should the human review before merging?
- Why is this task blocked?

Raw logs technically contain this, but they are too noisy for a command center.

### V1 Buildability

V1 can be a React component plus a small normalisation library. It can consume AgentPulse events, JSONL logs, or simple arrays. The first version can be read-only and local-first.

## V1 Scope

- Package: `@tooltrace/core` for event normalisation and grouping.
- Package: `@tooltrace/react` for timeline rendering.
- Timeline event types:
  - message
  - command
  - tool call
  - file change
  - test/check
  - approval request
  - error/retry
  - blocker
  - PR/commit link
  - completion proof
- Views:
  - compact live feed
  - grouped run summary
  - review/proof mode
- Copyable proof summary generator.
- Adapters for AgentPulse events and generic JSONL logs.
- Demo with simulated CrewCmd task run.

## Out of Scope

- Full observability backend.
- Cloud trace storage.
- Log scraping from arbitrary private systems by default.
- Autonomous review or approval decisions.
- Replacing GitHub PR review.

## CLI/API Sketch

```tsx
import { ToolTrace } from '@tooltrace/react';

<ToolTrace
  events={events}
  mode="review"
  showProofSummary
  onOpenFile={(path) => openInEditor(path)}
/>
```

```ts
import { createProofSummary } from '@tooltrace/core';

const summary = createProofSummary(events, {
  includeCommands: true,
  includeChecks: true,
  includePullRequests: true,
});
```

```bash
tooltrace render ./run.jsonl --out TOOLTRACE.md
tooltrace summary ./run.jsonl
```

## Verification

- Normalisation tests for AgentPulse events and generic logs.
- Snapshot tests for proof summary output.
- React component smoke tests.
- Demo fixture with success, failure, retry, approval, and blocker states.
- README with integration examples for CrewCmd-style apps.
- No network calls in core package.

## Agent Prompt

Build `tooltrace` as a local-first activity timeline and proof-of-work component for agent apps. Focus on making raw tool/runtime activity legible and reviewable. It should integrate cleanly with AgentPulse and eventually CrewCmd, but remain useful as a standalone React component and CLI summary generator.
