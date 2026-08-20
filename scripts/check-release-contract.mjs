#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function checkReleaseContract({ workflow, manifest, lockfile, changelog, readme, releasing, releasebox }) {
  const version = manifest.version;
  const escapedVersion = version.replaceAll('.', '\\.');

  assert.equal(releasebox.release?.publishNpm, true,
    'ReleaseBox publishNpm must agree with the npm-publishing release workflow');
  assert.ok(releasebox.packageManagers?.includes('npm'),
    'ReleaseBox package managers must include npm when the workflow publishes npm');

  assert.equal(lockfile.version, version, 'lockfile version must match package version');
assert.equal(lockfile.packages?.['']?.version, version, 'root lockfile package must match package version');
assert.match(changelog, new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm'),
  'changelog must contain a dated section for the package version');
  assert.match(changelog, /^\[Unreleased\]: https:\/\/github\.com\/rogerchappel\/tooltrace\/compare\/v0\.1\.0\.\.\.HEAD$/m,
    'Unreleased changelog link must start at the latest published tag');
  assert.match(changelog, new RegExp(`^\\[${escapedVersion}\\]: https://github\\.com/rogerchappel/tooltrace/compare/v0\\.1\\.0\\.\\.\\.HEAD$`, 'm'),
    'an unpublished prepared version must link to a comparison that exists');
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
}

export async function checkRepository(root = new URL('../', import.meta.url)) {
  const read = (path) => readFile(new URL(path, root), 'utf8');
  checkReleaseContract({
    workflow: await read('.github/workflows/release.yml'),
    manifest: JSON.parse(await read('package.json')),
    lockfile: JSON.parse(await read('package-lock.json')),
    changelog: await read('CHANGELOG.md'),
    readme: await read('README.md'),
    releasing: await read('docs/RELEASING.md'),
    releasebox: JSON.parse(await read('releasebox.config.json')),
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  await checkRepository();
  console.log('Release publishing contract passed.');
}
