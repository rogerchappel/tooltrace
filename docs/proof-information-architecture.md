# Proof Timeline Information Architecture

Status: Wave 1 contract  
Owner: tooltrace foundation  
Audience: core normalizer, adapters, React timeline, proof summary, CLI

## 1. Product Principle

ToolTrace is a proof-of-work timeline, not a generic log viewer. It should answer review questions quickly:

- What did the agent try to accomplish?
- What evidence proves the work happened?
- What changed in files, commands, checks, commits, and PRs?
- What failed, recovered, or remains blocked?
- What needs human approval or review before merge?

Raw runtime records are source evidence. ToolTrace events are curated proof units with provenance, severity, grouping, redaction, and review semantics.

## 2. Timeline Model

A run is rendered as ordered proof events grouped into reviewable phases.

```text
Run
└─ Groups / phases
   └─ Events
      ├─ Evidence links
      ├─ Metadata
      ├─ Redaction declarations
      └─ Source provenance
```

### Core entities

| Entity | Purpose | Notes |
|---|---|---|
| `run` | One agent task/session/dispatch | Has objective, repo, branch, actor, started/ended timestamps, and final status. |
| `group` | A reviewable chunk of related activity | Examples: planning, implementation, validation, PR creation, blocker investigation. |
| `event` | A normalized proof unit | Human-readable title plus structured metadata. |
| `evidence` | A link/reference that backs an event claim | File path, command output excerpt, check URL, commit, PR, artifact, transcript span. |
| `source` | Original runtime provenance | Adapter name, raw event id, timestamp, sequence, and optional raw pointer. |

## 3. Event Categories

Every event has exactly one `category`. Categories are stable public contract values.

| Category | Review question answered | Required semantics |
|---|---|---|
| `message` | What did the agent/user/subagent say that matters? | Capture meaningful instructions, decisions, handoffs, and status messages; omit chatter unless it changes task state. |
| `command` | Which shell/CLI command ran and what happened? | Include command, cwd, exit code/status, duration, safe output excerpt, and whether it was validation, setup, mutation, or inspection. |
| `tool` | Which non-shell tool/API/browser action was used? | Include tool name, action, target/resource, status, duration, and safe result summary. |
| `file_change` | Which files changed and why? | Include path, operation, language/type, line/add/delete counts when available, and related diff/commit evidence. |
| `check` | What verification passed, failed, or was skipped? | Include check name, command/provider, status, duration, coverage/scope, and artifacts/log links. |
| `approval` | What required human or policy approval? | Include request, risk, requested actor/scope, outcome, approver when known, and expiry/scope limits. |
| `error` | What failed? | Include failure point, reason, impact, recoverability, and linked retry/blocker if applicable. |
| `retry` | What recovered after failure? | Link to original error, attempt number, changed strategy, and final outcome. |
| `blocker` | Why can work not proceed? | Include blocking condition, owner, requested decision/input, workaround status, and next action. |
| `pr_commit` | What landed in version control/review? | Include commit SHA, branch, PR URL/number, title, target branch, and review status. |
| `completion_proof` | What proves the run is complete? | Final rollup of outcome, changed files, validations, PR/commit, known risks, and remaining follow-up. |

### Category-specific metadata

#### `message`
- `role`: `user | agent | subagent | system | reviewer`
- `author`: display-safe name/id
- `messageType`: `instruction | decision | status | handoff | clarification | note`
- `threadId`, `replyToEventId` when available
- `summary`: concise normalized content; raw content may be redacted or evidence-linked

#### `command`
- `command`: executable plus args after redaction
- `cwd`, `shell`, `environment`: safe environment labels, not full env dumps
- `intent`: `inspect | install | generate | mutate | validate | publish | cleanup | other`
- `exitCode`, `status`: `pending | running | success | failure | cancelled | skipped`
- `durationMs`, `startedAt`, `endedAt`
- `stdoutExcerpt`, `stderrExcerpt`, `outputTruncated`, `artifactRefs`

#### `tool`
- `toolName`, `action`, `provider`
- `target`: URL/path/resource identifier after redaction
- `inputSummary`, `resultSummary`
- `status`, `durationMs`, `artifactRefs`
- `sideEffect`: `none | local_read | local_write | network_read | network_write | external_mutation | unknown`

#### `file_change`
- `path`, `operation`: `created | modified | deleted | renamed | moved | generated`
- `oldPath` for renames/moves
- `fileType`, `language`, `package`
- `additions`, `deletions`, `changedLines`, `diffStat`
- `changeReason`: `feature | fix | docs | test | config | generated | cleanup | unknown`
- `evidence`: diff hunk, commit link, artifact, or workspace path

#### `check`
- `name`, `command` or `provider`
- `checkType`: `test | lint | typecheck | build | format | security | accessibility | smoke | manual | other`
- `status`: `passed | failed | skipped | cancelled | warning`
- `scope`: files/packages/features covered
- `durationMs`, `exitCode`, `summary`, `artifactRefs`
- `skipReason` when skipped

#### `approval`
- `approvalType`: `permission | external_mutation | destructive_action | credential_access | merge | deployment | cost | risk_acceptance`
- `requestSummary`, `riskSummary`, `scope`
- `status`: `requested | approved | denied | expired | cancelled`
- `requestedBy`, `requestedFrom`, `resolvedBy`, `resolvedAt`
- `limits`: allowed command/action, one-time vs session, expiry

#### `error`
- `errorType`: `command_failure | tool_failure | validation_failure | conflict | permission_denied | network | timeout | user_input_needed | unknown`
- `message`, `code`, `failedEventId`
- `impact`: `none | delayed | partial | blocks_completion | invalidates_proof`
- `recoverable`: boolean
- `nextEventId` linking retry/blocker/completion if known

#### `retry`
- `failedEventId`, `attempt`, `maxAttempts`
- `strategy`: what changed from the failed attempt
- `outcome`: `success | failure | abandoned | blocked`
- `replacementEventIds`: successful events that supersede the failed one

#### `blocker`
- `blockerType`: `missing_input | failing_check | merge_conflict | permission | dependency | external_service | unclear_scope | policy | unknown`
- `summary`, `impact`, `owner`, `requestedAction`
- `status`: `open | mitigated | resolved | accepted_risk`
- `since`, `resolvedAt`, `resolutionEventId`

#### `pr_commit`
- `repo`, `branch`, `baseBranch`
- `commitSha`, `commitUrl`
- `prNumber`, `prUrl`, `prTitle`, `prState`
- `changeSummary`, `reviewStatus`
- `relatedFileEventIds`, `relatedCheckEventIds`

#### `completion_proof`
- `outcome`: `completed | partially_completed | blocked | failed | cancelled`
- `objectiveSummary`
- `workSummary`: bullets of meaningful work performed
- `filesChanged`: important paths and reasons
- `checks`: pass/fail/skipped rollup
- `evidence`: commits, PRs, artifacts, screenshots, logs
- `risks`: known limitations, skipped validation, unresolved blockers
- `reviewRecommendation`: `ready_to_review | needs_human_decision | do_not_merge | informational`

## 4. Severity and Status

Severity communicates review urgency, not log verbosity.

| Severity | Meaning | UI treatment |
|---|---|---|
| `info` | Normal proof event | Default timeline row. |
| `success` | Positive proof: check passed, PR opened, completion achieved | Highlight as completed evidence. |
| `warning` | Needs attention but not necessarily blocked | Show in review checklist. |
| `error` | Failure occurred, may be recovered | Prominent; collapse only after linked retry succeeds. |
| `blocked` | Work cannot continue without external input/fix | Sticky in review mode and summary. |
| `approval` | Human/policy gate | Distinct from warning/error; decision-oriented. |

Event `status` is category-specific but should normalize to one of: `pending`, `running`, `success`, `failure`, `skipped`, `cancelled`, `blocked`, `approved`, `denied`, `warning`.

## 5. Evidence Links

Evidence turns claims into reviewable proof. Every non-message event should include at least one evidence item when available.

```ts
type EvidenceKind =
  | 'file'
  | 'diff'
  | 'command_output'
  | 'check_report'
  | 'artifact'
  | 'commit'
  | 'pull_request'
  | 'url'
  | 'screenshot'
  | 'transcript'
  | 'raw_event';
```

Evidence fields:
- `kind`
- `label`
- `href` for URLs or UI routes
- `path` for local files
- `eventId` for internal cross-links
- `excerpt` for short safe snippets
- `lineStart`, `lineEnd` where applicable
- `redacted`: boolean
- `integrity`: optional checksum/source id for artifacts

Evidence must be display-safe by default. If content is sensitive, link to a redacted artifact and record redaction metadata.

## 6. Redaction and Privacy Fields

ToolTrace must preserve useful proof without leaking secrets.

All events may include:

- `redactions`: list of redaction records
- `visibility`: `public | team | private | secret`
- `containsSensitive`: boolean
- `safeSummary`: required when raw title/summary is redacted

Redaction record fields:
- `field`: JSON pointer or field name
- `reason`: `secret | credential | pii | token | internal_url | customer_data | oversized | policy | unknown`
- `strategy`: `masked | omitted | hashed | summarized | linked_private_artifact`
- `replacement`: optional display text such as `[REDACTED_TOKEN]`

Rules:
1. Never render full env vars, tokens, cookies, private keys, or credential headers.
2. Command output excerpts should be capped and marked when truncated.
3. URLs should preserve host/path only when safe; redact tokens/query secrets.
4. File paths are evidence, but home directories and customer identifiers may be masked by adapter policy.
5. Redaction must be explicit so reviewers know proof was intentionally limited.

## 7. Grouping Rules

Groups make the timeline scannable. The normalizer should group by intent and causality before timestamp noise.

Default group types:

| Group type | Includes | Completion rule |
|---|---|---|
| `planning` | Instructions, clarifications, decisions | Ends when implementation/check activity begins. |
| `implementation` | File changes, generators, mutation commands/tools | Ends before validation or when a blocker appears. |
| `validation` | Checks, smoke tests, builds, manual verification | Ends when checks finish or retry loop begins. |
| `recovery` | Error + retry sequences | Ends when retry succeeds, is abandoned, or becomes blocker. |
| `approval` | Approval requests and outcomes | Ends when resolved or expired. |
| `review_artifact` | Commit/PR creation and summary output | Ends when PR/commit evidence is recorded. |
| `blocked` | Blocker event plus supporting evidence | Remains open until resolved/accepted. |
| `completion` | Completion proof and final handoff | Last group for terminal runs. |

Grouping precedence:
1. Explicit `groupId` from source wins.
2. Retry events group with their failed event and recovery evidence.
3. Checks run from a command may appear as both command evidence and normalized check; in review mode prefer the check row, with command as evidence.
4. File changes should be grouped by logical change reason, not one row per low-signal generated file.
5. PR/commit events collect related file/check events via ids or commit contents.
6. Completion proof references all important groups but does not duplicate raw event detail.

Noise-collapsing rules:
- Collapse repeated progress/status messages unless they change state.
- Collapse install/build output into command/check summaries.
- Collapse many generated files into one file_change group with expandable children.
- Preserve failures even if later recovered; mark them as recovered instead of deleting them.

## 8. Proof Summary Semantics

A proof summary is a copyable, human-readable rollup generated from normalized events.

Required sections when data exists:
1. `Outcome` — terminal status and one-sentence result.
2. `Work performed` — meaningful implementation/decision bullets.
3. `Files changed` — key paths with reasons, not exhaustive generated noise.
4. `Validation` — checks run, pass/fail/skipped, command evidence.
5. `Evidence` — PR, commits, artifacts, screenshots, logs.
6. `Issues and recovery` — errors, retries, blockers, approvals.
7. `Review notes` — risks, skipped validation, recommended reviewer action.

Summary rules:
- Prefer proof over chronology.
- Include failed checks if they influenced the final state.
- Do not claim completion if terminal outcome is blocked/partial.
- Surface skipped validation with reason.
- Link to PR/commit/check evidence when available.
- Keep Slack summaries terse; PR summaries may be more complete.

## 9. Review-Mode UX

Review mode optimizes for trust decisions rather than live monitoring.

### Layout
- Header: objective, branch/repo, run status, duration, actor, PR/commit links.
- Proof summary card: copyable markdown, outcome, validation rollup, risk badges.
- Review checklist: approvals, failed/recovered errors, blockers, skipped checks, files changed, PR/commit.
- Grouped timeline: expandable groups with important evidence visible by default.
- Evidence drawer: raw snippets, diff links, command output excerpts, artifacts.

### Interaction rules
- Default collapsed rows should still show: title, category icon, severity, status, timestamp, and evidence count.
- High-severity rows (`warning`, `error`, `blocked`, `approval`) are expanded or called out in checklist.
- Recovered errors remain visible with “recovered by retry” linkage.
- Blocked runs show the requested human action before lower-priority details.
- Copy actions must use redacted/safe content only.
- Filters: `all`, `changes`, `validation`, `issues`, `approvals`, `evidence`.
- Accessibility: timeline rows are keyboard navigable; severity/status are text labels, not color-only.

## 10. Minimal Contract Shape

This is the handoff shape for Wave 2 implementations. Adapters may keep raw source data elsewhere, but normalized events should conform to this shape.

```ts
type ToolTraceCategory =
  | 'message'
  | 'command'
  | 'tool'
  | 'file_change'
  | 'check'
  | 'approval'
  | 'error'
  | 'retry'
  | 'blocker'
  | 'pr_commit'
  | 'completion_proof';

interface ToolTraceEvent {
  id: string;
  category: ToolTraceCategory;
  title: string;
  summary?: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'blocked' | 'approval';
  status: string;
  timestamp: string;
  groupId?: string;
  parentEventId?: string;
  relatedEventIds?: string[];
  evidence?: Evidence[];
  metadata?: Record<string, unknown>;
  redactions?: Redaction[];
  source?: SourceProvenance;
}
```

## 11. Implementation Handoff Notes

- `@tooltrace/core` should normalize category/status/severity first, then group, then summarize.
- Adapters should preserve source ids for traceability but should not expose raw payloads by default.
- React should render unknown metadata safely and category-specific metadata richly.
- CLI should fail loudly on malformed events but tolerate unknown metadata keys.
- Tests should include a run with failure, retry, file changes, checks, approval, PR link, blocker, and completion proof.
