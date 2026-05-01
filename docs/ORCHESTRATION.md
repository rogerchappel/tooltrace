# Orchestration Handoff

## Summary

- Workspace: default
- Repository: tooltrace
- Source: assistant-authored from PRD.md by Neo; designed as LLM-quality orchestration with explicit concurrency waves
- Total tasks: 9
- Dispatch now: tooltrace-define-proof-information-architecture
- Blocked tasks: tooltrace-quality-review-release

## Product North Star

Build a polished activity timeline and proof-of-work layer that turns agent tool/runtime events into something users can trust, review, and share without reading raw logs.

## Dispatch Prompt

Dispatch Wave 1 first. These tasks may run concurrently:
- tooltrace-define-proof-information-architecture

Wait for the whole wave to finish and pass verification before dispatching the next sequential wave. Inside a concurrent wave, assign separate agents to separate branches and merge only after each task meets its acceptance criteria.

## LLM Refinement Notes
- This is not a log viewer. The wedge is human-readable proof: grouping, summarisation, evidence, and review mode.
- Design the event model around review questions: what happened, what changed, what passed, what failed, what needs approval?
- Core normalisation and React rendering can proceed in parallel after the product information architecture is set.
- The summary generator should be good enough to paste into PRs or completion reports.

## Concurrency Strategy

The best concurrency path is to protect the product contract first, then split work by stable interface boundaries. Do not dispatch renderer/provider/UI/demo work before the contracts they consume are stable. Once a wave is open, prefer parallel agents with narrow ownership and explicit handoff notes.

## Sequential Waves

### Wave 1: Proof information architecture

- Mode inside wave: sequential
- Dispatch: now
- Tasks: tooltrace-define-proof-information-architecture

### Wave 2: Core and adapter foundations

- Mode inside wave: concurrent
- Dispatch: after_dependencies
- Tasks: tooltrace-build-core-normalizer, tooltrace-agentpulse-jsonl-adapters

### Wave 3: UI, summaries, and CLI

- Mode inside wave: concurrent
- Dispatch: after_dependencies
- Tasks: tooltrace-react-timeline-component, tooltrace-proof-summary-generator, tooltrace-cli-render-summary

### Wave 4: Demo and integration docs

- Mode inside wave: concurrent
- Dispatch: after_dependencies
- Tasks: tooltrace-demo-crewcmd-run, tooltrace-docs-integration-recipes

### Wave 5: Quality review

- Mode inside wave: sequential
- Dispatch: after_human_decision
- Tasks: tooltrace-quality-review-release

## Task Dependencies

### tooltrace-define-proof-information-architecture: Define proof timeline information architecture

- Phase: foundation
- Repo: tooltrace
- Branch: agent/define-proof-information-architecture
- Risk: medium
- Depends on: None
- Can run concurrently with: None
- Dispatchable now: Yes
- Blocked by: None

**Objective**

Specify event categories, grouping rules, severity, evidence links, file/command/check metadata, redaction fields, and review-mode UX.

**Acceptance Criteria**

Architecture doc defines message, command, tool, file change, check, approval, error, retry, blocker, PR/commit, and completion proof semantics.

### tooltrace-build-core-normalizer: Build core event normalisation and grouping library

- Phase: implementation
- Repo: tooltrace
- Branch: agent/build-core-normalizer
- Risk: medium
- Depends on: tooltrace-define-proof-information-architecture
- Can run concurrently with: tooltrace-agentpulse-jsonl-adapters
- Dispatchable now: No
- Blocked by: None

**Objective**

Implement @tooltrace/core to normalize raw events, group related activity, collapse noise, preserve provenance, and expose timeline/query APIs.

**Acceptance Criteria**

Unit tests cover grouping, ordering, redaction, retries, blockers, file changes, commands, checks, and completion proof.

### tooltrace-agentpulse-jsonl-adapters: Build AgentPulse and generic JSONL adapters

- Phase: integration
- Repo: tooltrace
- Branch: agent/agentpulse-jsonl-adapters
- Risk: medium
- Depends on: tooltrace-define-proof-information-architecture
- Can run concurrently with: tooltrace-build-core-normalizer
- Dispatchable now: No
- Blocked by: None

**Objective**

Convert AgentPulse events and generic JSONL logs into ToolTrace events with safe defaults and source metadata.

**Acceptance Criteria**

Fixture tests cover tool calls, approvals, failures, browser actions, exec/process commands, commits, PR links, and subagent handoffs.

### tooltrace-react-timeline-component: Build React timeline component and review modes

- Phase: implementation
- Repo: tooltrace
- Branch: agent/react-timeline-component
- Risk: medium
- Depends on: tooltrace-define-proof-information-architecture
- Can run concurrently with: tooltrace-proof-summary-generator, tooltrace-cli-render-summary
- Dispatchable now: No
- Blocked by: None

**Objective**

Implement @tooltrace/react with compact live feed, grouped run summary, review/proof mode, filters, and accessible keyboard navigation.

**Acceptance Criteria**

Smoke/snapshot tests cover empty, live, grouped, error, blocked, approval, and completed states.

### tooltrace-proof-summary-generator: Build copyable proof summary generator

- Phase: implementation
- Repo: tooltrace
- Branch: agent/proof-summary-generator
- Risk: medium
- Depends on: tooltrace-build-core-normalizer
- Can run concurrently with: tooltrace-react-timeline-component, tooltrace-cli-render-summary
- Dispatchable now: No
- Blocked by: None

**Objective**

Create summaries that highlight commands, files, checks, PRs, blockers, decisions, and final verification in a human-readable format.

**Acceptance Criteria**

Snapshot tests generate PR-ready and Slack-ready summaries from realistic fixtures.

### tooltrace-cli-render-summary: Add CLI render and summary commands

- Phase: implementation
- Repo: tooltrace
- Branch: agent/cli-render-summary
- Risk: low
- Depends on: tooltrace-build-core-normalizer, tooltrace-proof-summary-generator
- Can run concurrently with: tooltrace-react-timeline-component, tooltrace-proof-summary-generator
- Dispatchable now: No
- Blocked by: None

**Objective**

Implement tooltrace render and tooltrace summary for local JSONL files, producing markdown output suitable for artifacts or review.

**Acceptance Criteria**

CLI tests verify input validation, markdown output, redaction, and useful errors.

### tooltrace-demo-crewcmd-run: Build simulated CrewCmd run demo

- Phase: demo
- Repo: tooltrace
- Branch: agent/demo-crewcmd-run
- Risk: medium
- Depends on: tooltrace-agentpulse-jsonl-adapters, tooltrace-react-timeline-component, tooltrace-proof-summary-generator
- Can run concurrently with: tooltrace-docs-integration-recipes
- Dispatchable now: No
- Blocked by: None

**Objective**

Create a demo showing a successful task with failure/retry, file changes, checks, approval, PR link, and final proof summary.

**Acceptance Criteria**

Demo is polished enough for screenshots and explains why ToolTrace is not raw logs.

### tooltrace-docs-integration-recipes: Write integration docs and review recipes

- Phase: documentation
- Repo: tooltrace
- Branch: agent/docs-integration-recipes
- Risk: low
- Depends on: tooltrace-demo-crewcmd-run, tooltrace-cli-render-summary
- Can run concurrently with: tooltrace-demo-crewcmd-run
- Dispatchable now: No
- Blocked by: None

**Objective**

Document React usage, core normalisation, AgentPulse adapter, JSONL format, proof summary recipes, privacy/redaction, and CrewCmd-style integration.

**Acceptance Criteria**

README helps a new agent UI embed useful proof-of-work in under an hour.

### tooltrace-quality-review-release: Quality review and release readiness

- Phase: final_validation
- Repo: tooltrace
- Branch: agent/quality-review-release
- Risk: high
- Depends on: tooltrace-docs-integration-recipes
- Can run concurrently with: None
- Dispatchable now: No
- Blocked by: approve high-risk scope before dispatch

**Objective**

Run tests, inspect demo, review accessibility, verify summaries, and ensure proof output is concise rather than noisy.

**Acceptance Criteria**

Human/product review confirms the component increases trust and does not overwhelm users.
