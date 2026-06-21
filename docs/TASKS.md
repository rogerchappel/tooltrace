# Task Queue: tooltrace

Source: assistant-authored from PRD.md by Neo; designed as LLM-quality orchestration with explicit concurrency waves
Format: assistant-authored orchestration derived from docs/PRD.md

## Product North Star

Build a polished activity timeline and proof-of-work layer that turns agent tool/runtime events into something users can trust, review, and share without reading raw logs.

## Tasks

### tooltrace-define-proof-information-architecture: Define proof timeline information architecture

- Repo: `tooltrace`
- Phase: `foundation`
- Risk: `medium`
- Branch: `agent/define-proof-information-architecture`
- Depends on: None

**Objective**

Specify event categories, grouping rules, severity, evidence links, file/command/check metadata, redaction fields, and review-mode UX.

**Acceptance Criteria**

Architecture doc defines message, command, tool, file change, check, approval, error, retry, blocker, PR/commit, and completion proof semantics.

### tooltrace-build-core-normalizer: Build core event normalisation and grouping library

- Repo: `tooltrace`
- Phase: `implementation`
- Risk: `medium`
- Branch: `agent/build-core-normalizer`
- Depends on: `tooltrace-define-proof-information-architecture`

**Objective**

Implement @tooltrace/core to normalize raw events, group related activity, collapse noise, preserve provenance, and expose timeline/query APIs.

**Acceptance Criteria**

Unit tests cover grouping, ordering, redaction, retries, blockers, file changes, commands, checks, and completion proof.

### tooltrace-agentpulse-jsonl-adapters: Build AgentPulse and generic JSONL adapters

- Repo: `tooltrace`
- Phase: `integration`
- Risk: `medium`
- Branch: `agent/agentpulse-jsonl-adapters`
- Depends on: `tooltrace-define-proof-information-architecture`

**Objective**

Convert AgentPulse events and generic JSONL logs into ToolTrace events with safe defaults and source metadata.

**Acceptance Criteria**

Fixture tests cover tool calls, approvals, failures, browser actions, exec/process commands, commits, PR links, and subagent handoffs.

### tooltrace-react-timeline-component: Build React timeline component and review modes

- Repo: `tooltrace`
- Phase: `implementation`
- Risk: `medium`
- Branch: `agent/react-timeline-component`
- Depends on: `tooltrace-define-proof-information-architecture`

**Objective**

Implement @tooltrace/react with compact live feed, grouped run summary, review/proof mode, filters, and accessible keyboard navigation.

**Acceptance Criteria**

Smoke/snapshot tests cover empty, live, grouped, error, blocked, approval, and completed states.

### tooltrace-proof-summary-generator: Build copyable proof summary generator

- Repo: `tooltrace`
- Phase: `implementation`
- Risk: `medium`
- Branch: `agent/proof-summary-generator`
- Depends on: `tooltrace-build-core-normalizer`

**Objective**

Create summaries that highlight commands, files, checks, PRs, blockers, decisions, and final verification in a human-readable format.

**Acceptance Criteria**

Snapshot tests generate PR-ready and Slack-ready summaries from realistic fixtures.

### tooltrace-cli-render-summary: Add CLI render and summary commands

- Repo: `tooltrace`
- Phase: `implementation`
- Risk: `low`
- Branch: `agent/cli-render-summary`
- Depends on: `tooltrace-build-core-normalizer`, `tooltrace-proof-summary-generator`

**Objective**

Implement tooltrace render and tooltrace summary for local JSONL files, producing markdown output suitable for artifacts or review.

**Acceptance Criteria**

CLI tests verify input validation, markdown output, redaction, and useful errors.

### tooltrace-demo-crewcmd-run: Build simulated CrewCmd run demo

- Repo: `tooltrace`
- Phase: `demo`
- Risk: `medium`
- Branch: `agent/demo-crewcmd-run`
- Depends on: `tooltrace-agentpulse-jsonl-adapters`, `tooltrace-react-timeline-component`, `tooltrace-proof-summary-generator`

**Objective**

Create a demo showing a successful task with failure/retry, file changes, checks, approval, PR link, and final proof summary.

**Acceptance Criteria**

Demo is polished enough for screenshots and explains why ToolTrace is not raw logs.

### tooltrace-docs-integration-recipes: Write integration docs and review recipes

- Repo: `tooltrace`
- Phase: `documentation`
- Risk: `low`
- Branch: `agent/docs-integration-recipes`
- Depends on: `tooltrace-demo-crewcmd-run`, `tooltrace-cli-render-summary`

**Objective**

Document React usage, core normalisation, AgentPulse adapter, JSONL format, proof summary recipes, privacy/redaction, and CrewCmd-style integration.

**Acceptance Criteria**

README helps a new agent UI embed useful proof-of-work in under an hour.

### tooltrace-quality-review-release: Quality review and release readiness

- Repo: `tooltrace`
- Phase: `final_validation`
- Risk: `high`
- Branch: `agent/quality-review-release`
- Depends on: `tooltrace-docs-integration-recipes`

**Objective**

Run tests, inspect demo, review accessibility, verify summaries, and ensure proof output is concise rather than noisy.

**Acceptance Criteria**

Human/product review confirms the component increases trust and does not overwhelm users.

### tooltrace-proof-gate: Add CI-friendly proof gates

- Repo: `tooltrace`
- Phase: `release_candidate`
- Risk: `low`
- Branch: `release-candidate/tooltrace`
- Depends on: `tooltrace-proof-summary-generator`, `tooltrace-cli-render-summary`

**Objective**

Expose a deterministic proof gate that lets review scripts fail on unresolved blockers, pending approvals, failed checks, or missing completion proof.

**Acceptance Criteria**

`createProofGate` is exported, JSON summary output includes gate counts, and `tooltrace summary --fail-on ...` exits non-zero for matching unresolved proof.
