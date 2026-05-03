import test from 'node:test';
import assert from 'node:assert/strict';
import { countTimelineEvents, createTimeline } from '../src/index.js';

test('counts events by category and review state', () => {
  const timeline = createTimeline([
    { category: 'approval', title: 'Needs review' },
    { category: 'blocker', title: 'Blocked' },
    { type: 'exec', command: 'npm test', status: 'passed' },
  ]);
  assert.equal(timeline.counts.total, 3);
  assert.equal(timeline.counts.approval, 1);
  assert.equal(timeline.counts.command, 1);
  assert.equal(timeline.counts.blocking, 1);
  assert.equal(timeline.counts.needsApproval, 1);
  assert.deepEqual(countTimelineEvents(timeline.events), timeline.counts);
});
