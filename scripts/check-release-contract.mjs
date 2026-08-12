#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');

assert.match(workflow, /^\s+environment: npm$/m, 'release job must use the protected npm environment');
assert.match(workflow, /^\s+id-token: write$/m, 'release workflow must request an OIDC token');
assert.match(workflow, /npm run release:check/, 'release checks must run before publication');
assert.match(workflow, /GITHUB_REF_NAME#v/, 'tag version must be checked against the package');
assert.match(workflow, /npm pack --json/, 'publication must use an explicitly captured tarball');
assert.match(
  workflow,
  /npm view "tooltrace@\$version" version[\s\S]*npm publish "\$\{\{ steps\.pack\.outputs\.tarball \}\}" --access public --provenance/,
  'the captured tarball must be published with provenance'
);
assert.match(workflow, /node scripts\/verify-published\.mjs/, 'the published package must be verified');

const checkIndex = workflow.indexOf('npm run release:check');
const packIndex = workflow.indexOf('npm pack --json');
const publishIndex = workflow.indexOf('npm publish');
const verifyIndex = workflow.indexOf('node scripts/verify-published.mjs');
assert.ok(checkIndex < packIndex && packIndex < publishIndex && publishIndex < verifyIndex,
  'release steps must check, pack, publish, then verify');

console.log('Release publishing contract passed.');
