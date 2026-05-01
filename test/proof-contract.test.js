import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOOLTRACE_EVENT_CATEGORIES,
  TOOLTRACE_EVIDENCE_KINDS,
  TOOLTRACE_GROUP_TYPES,
  TOOLTRACE_REDACTION_REASONS,
  TOOLTRACE_SEVERITIES,
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
