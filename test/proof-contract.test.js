import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOOLTRACE_EVENT_CATEGORIES,
  TOOLTRACE_EVIDENCE_KINDS,
  TOOLTRACE_GROUP_TYPES,
  TOOLTRACE_REDACTION_REASONS,
  TOOLTRACE_SEVERITIES,
  createProofGate,
  isToolTraceCategory,
} from '../src/index.js';

const requiredCategories = [
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
];

test('Wave 1 proof contract exposes required event categories', () => {
  assert.deepEqual(TOOLTRACE_EVENT_CATEGORIES, requiredCategories);
  assert.equal(isToolTraceCategory('command'), true);
  assert.equal(isToolTraceCategory('log_line'), false);
});

test('Wave 1 proof contract covers review metadata dimensions', () => {
  assert.ok(TOOLTRACE_SEVERITIES.includes('approval'));
  assert.ok(TOOLTRACE_SEVERITIES.includes('blocked'));
  assert.ok(TOOLTRACE_GROUP_TYPES.includes('recovery'));
  assert.ok(TOOLTRACE_GROUP_TYPES.includes('review_artifact'));
  assert.ok(TOOLTRACE_EVIDENCE_KINDS.includes('pull_request'));
  assert.ok(TOOLTRACE_EVIDENCE_KINDS.includes('command_output'));
  assert.ok(TOOLTRACE_REDACTION_REASONS.includes('credential'));
  assert.ok(TOOLTRACE_REDACTION_REASONS.includes('customer_data'));
});

test('proof gate fails unresolved blockers, approvals, failed checks, and missing completion proof', () => {
  const gate = createProofGate([
    { timestamp: '2026-05-01T01:00:00Z', type: 'check', title: 'npm test', status: 'failed' },
    { timestamp: '2026-05-01T01:01:00Z', type: 'approval_request', title: 'Needs deploy approval' },
    { timestamp: '2026-05-01T01:02:00Z', type: 'blocked', title: 'Missing fixture' },
  ], { requireCompletion: true });

  assert.equal(gate.passed, false);
  assert.deepEqual(gate.counts, {
    failedChecks: 1,
    blockers: 1,
    approvals: 1,
    missingCompletion: 1,
  });
});
