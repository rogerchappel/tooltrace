import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewChecklist } from '../src/index.js';

test('review checklist highlights missing completion proof and blockers', () => {
  const checklist = createReviewChecklist([
    { type: 'exec', command: 'npm test', status: 'passed' },
    { category: 'blocker', title: 'Waiting for approval' },
  ]);
  assert.equal(checklist.find((item) => item.id === 'commands-reviewed').passed, true);
  assert.equal(checklist.find((item) => item.id === 'blockers-resolved').passed, false);
  assert.equal(checklist.find((item) => item.id === 'completion-proof').passed, false);
});
