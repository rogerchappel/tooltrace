import test from 'node:test';
import assert from 'node:assert/strict';
import { collectTimelineEvidence } from '../src/index.js';

test('collects unique evidence with event provenance', () => {
  const evidence = collectTimelineEvidence([
    { category: 'file_change', filePath: 'src/index.js', title: 'Changed core' },
    { type: 'commit', commit: 'abc123', title: 'Commit core' },
    { type: 'commit', commit: 'abc123', title: 'Duplicate commit evidence' },
  ]);
  assert.deepEqual(evidence.map((item) => item.kind), ['file', 'commit']);
  assert.equal(evidence[0].eventTitle, 'Changed core');
});
