export const TOOLTRACE_EVENT_CATEGORIES = Object.freeze([
  'message',
  'command',
  'tool',
  'file_change',
  'check',
  'approval',
  'error',
  'retry',
  'blocker',
  'pr_commit',
  'completion_proof',
]);

export const TOOLTRACE_SEVERITIES = Object.freeze([
  'info',
  'success',
  'warning',
  'error',
  'blocked',
  'approval',
]);

export const TOOLTRACE_GROUP_TYPES = Object.freeze([
  'planning',
  'implementation',
  'validation',
  'recovery',
  'approval',
  'review_artifact',
  'blocked',
  'completion',
]);

export const TOOLTRACE_EVIDENCE_KINDS = Object.freeze([
  'file',
  'diff',
  'command_output',
  'check_report',
  'artifact',
  'commit',
  'pull_request',
  'url',
  'screenshot',
  'transcript',
  'raw_event',
]);

export const TOOLTRACE_REDACTION_REASONS = Object.freeze([
  'secret',
  'credential',
  'pii',
  'token',
  'internal_url',
  'customer_data',
  'oversized',
  'policy',
  'unknown',
]);

export const DEFAULT_REDACTION_PATTERNS = Object.freeze([
  { reason: 'credential', pattern: /\b(?:api[_-]?key|token|secret|password)\s*[=:]\s*[^\s,;]+/gi, replacement: '$1=[redacted:credential]' },
  { reason: 'token', pattern: /\b(?:ghp|gho|github_pat|sk)-[A-Za-z0-9_\-]{12,}\b/g, replacement: '[redacted:token]' },
]);

const CATEGORY_ALIASES = Object.freeze({
  log: 'message',
  log_line: 'message',
  assistant_message: 'message',
  user_message: 'message',
  exec: 'command',
  process: 'command',
  shell: 'command',
  tool_call: 'tool',
  tool_result: 'tool',
  file: 'file_change',
  file_edit: 'file_change',
  test: 'check',
  validation: 'check',
  approval_request: 'approval',
  failure: 'error',
  exception: 'error',
  blocked: 'blocker',
  blocker_found: 'blocker',
  pr: 'pr_commit',
  pull_request: 'pr_commit',
  commit: 'pr_commit',
  complete: 'completion_proof',
  completion: 'completion_proof',
});

const STATUS_TO_SEVERITY = Object.freeze({
  passed: 'success',
  pass: 'success',
  success: 'success',
  completed: 'success',
  failed: 'error',
  fail: 'error',
  error: 'error',
  blocked: 'blocked',
  pending_approval: 'approval',
  approval: 'approval',
  warning: 'warning',
  retrying: 'warning',
});

export function isToolTraceCategory(value) {
  return TOOLTRACE_EVENT_CATEGORIES.includes(value);
}

export function normalizeCategory(value = 'message') {
  const candidate = String(value).trim().toLowerCase();
  const category = CATEGORY_ALIASES[candidate] ?? candidate;
  return isToolTraceCategory(category) ? category : 'message';
}

export function normalizeSeverity(value, category = 'message', status) {
  const candidate = value ? String(value).trim().toLowerCase() : undefined;
  if (candidate && TOOLTRACE_SEVERITIES.includes(candidate)) return candidate;
  const statusSeverity = status ? STATUS_TO_SEVERITY[String(status).trim().toLowerCase()] : undefined;
  if (statusSeverity) return statusSeverity;
  if (category === 'approval') return 'approval';
  if (category === 'blocker') return 'blocked';
  if (category === 'error') return 'error';
  if (category === 'retry') return 'warning';
  if (category === 'completion_proof') return 'success';
  return 'info';
}

export function redactText(value, options = {}) {
  if (value == null) return value;
  let text = String(value);
  const redactions = [];
  for (const { pattern, replacement, reason } of options.patterns ?? DEFAULT_REDACTION_PATTERNS) {
    text = text.replace(pattern, (...args) => {
      redactions.push({ reason, pattern: pattern.source });
      if (typeof replacement === 'function') return replacement(...args);
      return replacement;
    });
  }
  const maxLength = options.maxTextLength ?? 4000;
  if (text.length > maxLength) {
    text = `${text.slice(0, maxLength)}… [redacted:oversized ${text.length - maxLength} chars]`;
    redactions.push({ reason: 'oversized', originalLength: String(value).length, maxLength });
  }
  return { text, redactions };
}

function stableId(raw, index) {
  if (raw.id) return String(raw.id);
  const basis = [raw.timestamp ?? raw.time ?? raw.ts ?? index, raw.type ?? raw.category, raw.title ?? raw.name ?? raw.command ?? raw.tool].join('|');
  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) hash = ((hash << 5) - hash + basis.charCodeAt(i)) | 0;
  return `evt_${index + 1}_${Math.abs(hash).toString(36)}`;
}

function normalizeEvidence(evidence = [], event) {
  const list = Array.isArray(evidence) ? evidence : [evidence];
  const out = list.filter(Boolean).map((item) => {
    if (typeof item === 'string') return { kind: item.startsWith('http') ? 'url' : 'artifact', label: item, href: item };
    return { ...item, kind: TOOLTRACE_EVIDENCE_KINDS.includes(item.kind) ? item.kind : 'artifact' };
  });
  if (event.filePath || event.path) out.push({ kind: 'file', label: event.filePath ?? event.path, path: event.filePath ?? event.path });
  if (event.commit) out.push({ kind: 'commit', label: event.commit, sha: event.commit });
  if (event.pullRequest || event.pr) out.push({ kind: 'pull_request', label: event.pullRequest ?? event.pr, href: event.pullRequest ?? event.pr });
  return out;
}

export function normalizeEvent(raw, index = 0, options = {}) {
  if (!raw || typeof raw !== 'object') throw new TypeError('ToolTrace events must be objects');
  const category = normalizeCategory(raw.category ?? raw.type ?? raw.kind);
  const titleSource = raw.title ?? raw.name ?? raw.command ?? raw.tool ?? raw.action ?? category.replace('_', ' ');
  const bodySource = raw.body ?? raw.message ?? raw.summary ?? raw.output ?? raw.error ?? '';
  const title = redactText(titleSource, options);
  const body = redactText(bodySource, options);
  const timestamp = raw.timestamp ?? raw.time ?? raw.ts ?? new Date(0).toISOString();
  const status = raw.status ?? raw.outcome;
  return {
    id: stableId(raw, index),
    category,
    severity: normalizeSeverity(raw.severity, category, status),
    status: status ?? (category === 'completion_proof' ? 'completed' : undefined),
    title: title.text,
    body: body.text,
    timestamp: new Date(timestamp).toISOString(),
    runId: raw.runId ?? raw.run_id ?? raw.sessionId ?? raw.session_id,
    groupId: raw.groupId ?? raw.group_id ?? raw.stepId ?? raw.step_id,
    parentId: raw.parentId ?? raw.parent_id,
    actor: raw.actor ?? raw.agent ?? raw.role,
    command: raw.command ? { value: redactText(raw.command, options).text, cwd: raw.cwd, exitCode: raw.exitCode ?? raw.exit_code, durationMs: raw.durationMs ?? raw.duration_ms } : raw.commandMetadata,
    tool: raw.tool || raw.toolName ? { name: raw.tool ?? raw.toolName, input: raw.input, output: raw.output } : raw.toolMetadata,
    file: raw.file ?? raw.filePath ?? raw.path ? { path: raw.filePath ?? raw.path ?? raw.file?.path, operation: raw.operation ?? raw.file?.operation, additions: raw.additions ?? raw.file?.additions, deletions: raw.deletions ?? raw.file?.deletions } : undefined,
    check: raw.check ?? raw.checkName ? { name: raw.checkName ?? raw.check?.name ?? raw.title, command: raw.checkCommand ?? raw.check?.command, passed: raw.passed ?? raw.check?.passed, exitCode: raw.exitCode ?? raw.check?.exitCode } : undefined,
    evidence: normalizeEvidence(raw.evidence, raw),
    redactions: [...(title.redactions ?? []), ...(body.redactions ?? []), ...(raw.redactions ?? [])],
    source: raw.source ?? { kind: 'raw_event', index },
    raw: options.includeRaw === false ? undefined : raw,
  };
}

export function normalizeEvents(events = [], options = {}) {
  return [...events]
    .map((event, index) => normalizeEvent(event, index, options))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id));
}

export function inferGroupType(event) {
  if (event.category === 'command' || event.category === 'tool' || event.category === 'file_change') return 'implementation';
  if (event.category === 'check') return 'validation';
  if (event.category === 'retry' || event.category === 'error') return 'recovery';
  if (event.category === 'approval') return 'approval';
  if (event.category === 'blocker') return 'blocked';
  if (event.category === 'pr_commit') return 'review_artifact';
  if (event.category === 'completion_proof') return 'completion';
  return 'planning';
}

export function groupTimelineEvents(events = [], options = {}) {
  const normalized = options.alreadyNormalized ? [...events] : normalizeEvents(events, options);
  const map = new Map();
  for (const event of normalized) {
    const groupId = event.groupId ?? `${event.runId ?? 'run'}:${inferGroupType(event)}`;
    if (!map.has(groupId)) {
      map.set(groupId, { id: groupId, type: inferGroupType(event), title: humanizeGroupTitle(inferGroupType(event)), severity: 'info', events: [], evidence: [] });
    }
    const group = map.get(groupId);
    group.events.push(event);
    group.evidence.push(...event.evidence);
    group.severity = mergeSeverity(group.severity, event.severity);
    group.startedAt = group.startedAt && group.startedAt < event.timestamp ? group.startedAt : event.timestamp;
    group.endedAt = !group.endedAt || group.endedAt < event.timestamp ? event.timestamp : group.endedAt;
  }
  return [...map.values()].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
}

function humanizeGroupTitle(type) {
  return ({ planning: 'Planning', implementation: 'Implementation', validation: 'Validation', recovery: 'Recovery', approval: 'Approval', review_artifact: 'Review artifacts', blocked: 'Blocked', completion: 'Completion proof' })[type] ?? 'Activity';
}

function mergeSeverity(current, incoming) {
  const rank = { info: 0, success: 1, approval: 2, warning: 3, blocked: 4, error: 5 };
  return rank[incoming] > rank[current] ? incoming : current;
}

export function createTimeline(events = [], options = {}) {
  const looksNormalized = events.every((event) => event && isToolTraceCategory(event.category) && event.severity && event.timestamp && Array.isArray(event.evidence));
  const normalized = options.alreadyNormalized || looksNormalized ? [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id)) : normalizeEvents(events, options);
  return {
    events: normalized,
    groups: groupTimelineEvents(normalized, { ...options, alreadyNormalized: true }),
    counts: countTimelineEvents(normalized),
    byCategory(category) { return normalized.filter((event) => event.category === category); },
    hasBlockers() { return normalized.some((event) => event.category === 'blocker' || event.severity === 'blocked'); },
    checksPassed() { return normalized.filter((event) => event.category === 'check').every((event) => event.severity === 'success' || event.check?.passed === true); },
  };
}

export function collectTimelineEvidence(events = []) {
  const timeline = Array.isArray(events) ? createTimeline(events) : events;
  const seen = new Set();
  const evidence = [];
  for (const event of timeline.events ?? []) {
    for (const item of event.evidence ?? []) {
      const key = `${item.kind}:${item.path ?? item.href ?? item.sha ?? item.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        evidence.push({ ...item, eventId: event.id, eventTitle: event.title });
      }
    }
  }
  return evidence;
}

export function countTimelineEvents(events = []) {
  const counts = Object.fromEntries(TOOLTRACE_EVENT_CATEGORIES.map((category) => [category, 0]));
  for (const event of events) {
    if (event?.category in counts) counts[event.category] += 1;
  }
  counts.total = events.length;
  counts.blocking = events.filter((event) => event.category === 'blocker' || event.severity === 'blocked').length;
  counts.needsApproval = events.filter((event) => event.category === 'approval' || event.severity === 'approval').length;
  return counts;
}


export function createReviewChecklist(events = []) {
  const timeline = Array.isArray(events) ? createTimeline(events) : events;
  const normalized = timeline.events ?? [];
  const checks = normalized.filter((event) => event.category === 'check');
  const blockers = normalized.filter((event) => event.category === 'blocker' || event.severity === 'blocked');
  const approvals = normalized.filter((event) => event.category === 'approval');
  return [
    { id: 'commands-reviewed', label: 'Commands are understandable', passed: normalized.some((event) => event.category === 'command') },
    { id: 'files-reviewed', label: 'File changes are named', passed: normalized.some((event) => event.category === 'file_change') },
    { id: 'checks-passed', label: 'Checks passed or failures are explained', passed: checks.length === 0 || checks.every((event) => event.severity === 'success' || event.check?.passed === true) },
    { id: 'approvals-visible', label: 'Approval requests are visible', passed: approvals.every((event) => event.severity === 'approval' || event.status) },
    { id: 'blockers-resolved', label: 'No unresolved blockers', passed: blockers.length === 0 },
    { id: 'completion-proof', label: 'Completion proof is present', passed: normalized.some((event) => event.category === 'completion_proof') },
  ];
}

export function createProofSummary(events = [], options = {}) {
  const timeline = Array.isArray(events) ? createTimeline(events, options) : events;
  const normalized = timeline.events ?? [];
  const format = options.format ?? 'markdown';
  const bullets = [];
  const add = (label, values) => {
    const unique = [...new Set(values.filter(Boolean))];
    if (unique.length) bullets.push(`- **${label}:** ${unique.join('; ')}`);
  };
  const title = options.title ?? 'ToolTrace proof summary';
  add('Commands', normalized.filter((e) => e.category === 'command').map((e) => `${e.command?.value ?? e.title}${e.command?.exitCode != null ? ` (exit ${e.command.exitCode})` : ''}`));
  add('Files', normalized.filter((e) => e.category === 'file_change').map((e) => `${e.file?.operation ?? 'changed'} ${e.file?.path ?? e.title}`));
  add('Checks', normalized.filter((e) => e.category === 'check').map((e) => `${e.title} — ${e.severity}`));
  add('PRs/commits', normalized.filter((e) => e.category === 'pr_commit').map((e) => e.title));
  add('Approvals', normalized.filter((e) => e.category === 'approval').map((e) => e.title));
  add('Blockers', normalized.filter((e) => e.category === 'blocker').map((e) => e.title));
  add('Completion', normalized.filter((e) => e.category === 'completion_proof').map((e) => e.title));
  const redactionCount = normalized.reduce((sum, e) => sum + (e.redactions?.length ?? 0), 0);
  if (redactionCount) bullets.push(`- **Redactions:** ${redactionCount} sensitive/noisy field(s) hidden`);
  const body = [`## ${title}`, '', ...bullets, '', `_${normalized.length} events across ${timeline.groups?.length ?? 0} proof group(s)._`].join('\n');
  if (format === 'slack') return body.replace(/^## /, '*').replace('\n\n', '*\n');
  return body;
}

export function parseJsonl(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try { return JSON.parse(line); }
      catch (error) { throw new SyntaxError(`Invalid JSONL at line ${index + 1}: ${error.message}`); }
    });
}

export function jsonlToToolTraceEvents(text, options = {}) {
  return normalizeEvents(parseJsonl(text), { ...options, includeRaw: options.includeRaw ?? false });
}

export function agentPulseToToolTraceEvent(event = {}, index = 0, options = {}) {
  const mapped = {
    id: event.id,
    timestamp: event.timestamp ?? event.createdAt,
    runId: event.runId ?? event.threadId,
    actor: event.agent ?? event.actor,
    source: { kind: 'agentpulse', index, eventType: event.type },
    ...event.payload,
  };
  const type = event.type ?? event.kind;
  if (/approval/i.test(type)) mapped.category = 'approval';
  else if (/browser|tool/i.test(type)) mapped.category = 'tool';
  else if (/exec|process|command/i.test(type)) mapped.category = 'command';
  else if (/file|diff/i.test(type)) mapped.category = 'file_change';
  else if (/check|test|build|lint/i.test(type)) mapped.category = 'check';
  else if (/fail|error/i.test(type)) mapped.category = 'error';
  else if (/retry/i.test(type)) mapped.category = 'retry';
  else if (/block/i.test(type)) mapped.category = 'blocker';
  else if (/commit|pull|pr/i.test(type)) mapped.category = 'pr_commit';
  else if (/complete|proof/i.test(type)) mapped.category = 'completion_proof';
  else mapped.category = 'message';
  mapped.title ??= event.title ?? event.message ?? type;
  mapped.body ??= event.message ?? event.payload?.output;
  return normalizeEvent(mapped, index, options);
}

export function agentPulseToToolTraceEvents(events = [], options = {}) {
  return events.map((event, index) => agentPulseToToolTraceEvent(event, index, options)).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
