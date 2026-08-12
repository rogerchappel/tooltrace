import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('release workflow preserves the trusted-publishing contract', () => {
  const result = spawnSync(process.execPath, ['scripts/check-release-contract.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Release publishing contract passed/);
});

test('registry verifier rejects a missing version without network access', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-published.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node scripts\/verify-published\.mjs <semver>/);
});
