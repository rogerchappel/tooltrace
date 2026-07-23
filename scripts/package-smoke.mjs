#!/usr/bin/env node
import { mkdir, mkdtemp, rm, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceRoot = resolve(process.argv[2] ?? '.');
const tempRoot = await mkdtemp(join(tmpdir(), 'tooltrace-package-smoke-'));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? sourceRoot,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: false
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }

  return result;
}

try {
  const packResult = run('npm', ['pack', '--pack-destination', tempRoot]);
  const tarballs = (await readdir(tempRoot)).filter((file) => file.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`expected one package tarball, found ${tarballs.length}`);
  }

  const appRoot = join(tempRoot, 'consumer');
  await mkdir(appRoot);

  run('npm', ['init', '-y'], { cwd: appRoot });
  run('npm', ['install', '--ignore-scripts', join(tempRoot, tarballs[0]), 'react@18', 'react-dom@18'], { cwd: appRoot });

  await writeFile(join(appRoot, 'sample.jsonl'), `${JSON.stringify({ event: 'start', title: 'Package smoke' })}\n`);
  run('npx', ['tooltrace', 'summary', 'sample.jsonl'], { cwd: appRoot });
  run('node', ['--input-type=module', '-e', "import { normalizeEvent } from 'tooltrace'; const event = normalizeEvent({ title: 'ok' }); if (event.title !== 'ok') process.exit(1);"] , { cwd: appRoot });

  await writeFile(join(appRoot, 'react-smoke.mjs'), `
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as components from 'tooltrace/react';

assert.deepEqual(Object.keys(components).sort(), [
  'ToolTrace',
  'ToolTraceProofSummary',
  'ToolTraceReviewChecklist',
]);

const events = [{
  type: 'test',
  title: 'Package React smoke',
  status: 'passed',
  timestamp: '2026-01-01T00:00:00.000Z',
}];

const timeline = renderToStaticMarkup(React.createElement(components.ToolTrace, {
  events,
  showProofSummary: true,
  showReviewChecklist: true,
}));
assert.match(timeline, /Package React smoke/);
assert.match(timeline, /ToolTrace review checklist/);
assert.match(timeline, /ToolTrace proof summary/);

const checklist = renderToStaticMarkup(React.createElement(components.ToolTraceReviewChecklist, { events }));
assert.match(checklist, /ToolTrace review checklist/);

const proof = renderToStaticMarkup(React.createElement(components.ToolTraceProofSummary, { events }));
assert.match(proof, /ToolTrace proof summary/);
`);
  run('node', ['react-smoke.mjs'], { cwd: appRoot });

  console.log('Package smoke passed.');
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
