import test from 'node:test';
import assert from 'node:assert/strict';
import { createProofSummary, createTimeline, normalizeEvents, redactText } from '../src/index.js';

const fixture = [
  { id: '2', timestamp: '2026-05-01T00:02:00Z', type: 'exec', command: 'npm test', exitCode: 0, status: 'passed', groupId: 'validate' },
  { id: '1', timestamp: '2026-05-01T00:01:00Z', category: 'file_change', filePath: 'src/index.js', operation: 'modified', groupId: 'impl' },
  { id: '3', timestamp: '2026-05-01T00:03:00Z', category: 'retry', title: 'Retried flaky check', groupId: 'recover' },
  { id: '4', timestamp: '2026-05-01T00:04:00Z', category: 'blocker', title: 'Needs API key token=abc123456789abcdef', groupId: 'blocked' },
  { id: '5', timestamp: '2026-05-01T00:05:00Z', category: 'completion_proof', title: 'Validation passed', groupId: 'done' },
];

test('normalizes ordering, redaction, commands, file changes, retries, blockers, checks, and completion', () => {
  const events = normalizeEvents(fixture);
  assert.deepEqual(events.map((event) => event.id), ['1', '2', '3', '4', '5']);
  assert.equal(events[1].category, 'command');
  assert.equal(events[1].severity, 'success');
  assert.equal(events[0].file.path, 'src/index.js');
  assert.equal(events[2].severity, 'warning');
  assert.equal(events[3].severity, 'blocked');
  assert.match(events[3].title, /\[redacted:credential\]/);
  assert.equal(events[4].severity, 'success');
});

test('redacts credential values while preserving normalized labels', () => {
  const input = [
    'api_key=supersecret',
    'token: abcdefghijklmnop',
    'Secret = do-not-show',
    'PASSWORD: also-private',
  ].join(' ');

  assert.equal(
    redactText(input).text,
    [
      'api_key=[redacted:credential]',
      'token=[redacted:credential]',
      'secret=[redacted:credential]',
      'password=[redacted:credential]',
    ].join(' '),
  );
});

test('leaves non-credential text unchanged', () => {
  const input = 'Processed 4 records without credentials';
  assert.equal(redactText(input).text, input);
});

test('groups timeline activity and exposes query helpers', () => {
  const timeline = createTimeline(fixture);
  assert.equal(timeline.groups.length, 5);
  assert.equal(timeline.byCategory('check').length, 0);
  assert.equal(timeline.hasBlockers(), true);
});

test('generates concise proof summary', () => {
  const summary = createProofSummary(fixture);
  assert.match(summary, /Shape/);
  assert.match(summary, /Commands/);
  assert.match(summary, /Files/);
  assert.match(summary, /Blockers/);
  assert.match(summary, /Completion/);
});
