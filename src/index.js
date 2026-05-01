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

export function isToolTraceCategory(value) {
  return TOOLTRACE_EVENT_CATEGORIES.includes(value);
}
