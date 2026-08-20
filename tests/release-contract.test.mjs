import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { checkReleaseContract } from '../scripts/check-release-contract.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function contract() {
  return {
    workflow: await read('.github/workflows/release.yml'),
    manifest: JSON.parse(await read('package.json')),
    lockfile: JSON.parse(await read('package-lock.json')),
    changelog: await read('CHANGELOG.md'),
    readme: await read('README.md'),
    releasing: await read('docs/RELEASING.md'),
    releasebox: JSON.parse(await read('releasebox.config.json')),
  };
}

test('repository release metadata agrees with the publishing workflow', async () => {
  const input = await contract();
  assert.doesNotThrow(() => checkReleaseContract(input));
});

test('rejects ReleaseBox metadata that disables workflow npm publishing', async () => {
  const input = await contract();
  input.releasebox.release.publishNpm = false;
  assert.throws(
    () => checkReleaseContract(input),
    /publishNpm must agree with the npm-publishing release workflow/,
  );
});
