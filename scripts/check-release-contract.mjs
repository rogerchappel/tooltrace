#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const releasing = await readFile(new URL('../docs/RELEASING.md', import.meta.url), 'utf8');

const version = manifest.version;
const escapedVersion = version.replaceAll('.', '\\.');

assert.equal(lockfile.version, version, 'lockfile version must match package version');
assert.equal(lockfile.packages?.['']?.version, version, 'root lockfile package must match package version');
assert.match(changelog, new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm'),
  'changelog must contain a dated section for the package version');
assert.match(changelog, new RegExp(`^\\[Unreleased\\]: https://github\\.com/rogerchappel/tooltrace/compare/v${escapedVersion}\\.\\.\\.HEAD$`, 'm'),
  'Unreleased changelog link must compare from the prepared tag');
assert.match(changelog, new RegExp(`^\\[${escapedVersion}\\]: https://github\\.com/rogerchappel/tooltrace/(?:compare/.+\\.\\.\\.v${escapedVersion}|releases/tag/v${escapedVersion})$`, 'm'),
  'changelog must define an exact link for the prepared version');
assert.match(readme, new RegExp(`npm install tooltrace@${escapedVersion}`),
  'README installation must use the exact prepared version');
assert.match(releasing, /npm view tooltrace@<version> version/,
  'release guide must retain the exact-version registry verification command');
assert.match(releasing, /npm install tooltrace@<version>/,
  'release guide must retain the exact-version clean install command');

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
