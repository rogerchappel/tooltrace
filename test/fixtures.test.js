import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { agentPulseToToolTraceEvents, createProofSummary, createTimeline, jsonlToToolTraceEvents } from '../src/index.js';

const fixture = (name) => new URL(`../tests/fixtures/${name}`, import.meta.url);

test('CrewCmd fixture produces reviewable proof groups', async () => {
  const events = jsonlToToolTraceEvents(await readFile(fixture('crewcmd-success.jsonl'), 'utf8'));
  const timeline = createTimeline(events, { alreadyNormalized: true });
  assert.ok(timeline.groups.length >= 5);
  assert.equal(timeline.hasBlockers(), false);
  assert.match(createProofSummary(timeline), /ToolTrace proof summary/);
});

test('blocked fixture preserves approval and blocker states', async () => {
  const events = jsonlToToolTraceEvents(await readFile(fixture('blocked-run.jsonl'), 'utf8'));
  assert.equal(events.find((event) => event.category === 'approval').severity, 'approval');
  assert.equal(events.find((event) => event.category === 'blocker').severity, 'blocked');
});

test('AgentPulse fixture imports source metadata', async () => {
  const raw = JSON.parse(await readFile(fixture('agentpulse-run.json'), 'utf8'));
  const events = agentPulseToToolTraceEvents(raw);
  assert.deepEqual(events.map((event) => event.source.kind), ['agentpulse', 'agentpulse', 'agentpulse']);
  assert.deepEqual(events.map((event) => event.category), ['command', 'file_change', 'completion_proof']);
});
