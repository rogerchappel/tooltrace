#!/usr/bin/env node
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  throw new Error('usage: node scripts/verify-published.mjs <semver>');
}

function npm(args, cwd) {
  return spawnSync('npm', args, { cwd, encoding: 'utf8', shell: false });
}

let publishedVersion;
for (let attempt = 1; attempt <= 12; attempt += 1) {
  const result = npm(['view', `tooltrace@${version}`, 'version', '--json']);
  if (result.status === 0) {
    publishedVersion = JSON.parse(result.stdout);
    break;
  }
  if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 10_000));
}

if (publishedVersion !== version) {
  throw new Error(`npm registry did not return tooltrace@${version}`);
}

const installRoot = await mkdtemp(join(tmpdir(), 'tooltrace-registry-smoke-'));
try {
  const result = npm(['install', '--ignore-scripts', '--no-package-lock', `tooltrace@${version}`], installRoot);
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    throw new Error(`could not install tooltrace@${version} from npm`);
  }
  const manifest = JSON.parse(await readFile(join(installRoot, 'node_modules/tooltrace/package.json'), 'utf8'));
  if (manifest.version !== version) throw new Error(`installed registry version mismatch: ${manifest.version}`);
} finally {
  await rm(installRoot, { recursive: true, force: true });
}

console.log(`Verified tooltrace@${version} on npm.`);
