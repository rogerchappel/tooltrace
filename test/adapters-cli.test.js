import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { agentPulseToToolTraceEvents, jsonlToToolTraceEvents, parseJsonl } from '../src/index.js';

const execFileAsync = promisify(execFile);

function runWithInput(command, args, input, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `process exited ${code}`));
    });
    child.stdin.end(input);
  });
}

test('generic JSONL adapter maps commands, approvals, failures, browser actions, commits, PRs, and subagent handoffs', () => {
  const jsonl = [
    { timestamp: '2026-05-01T01:00:00Z', type: 'process', command: 'git status' },
    { timestamp: '2026-05-01T01:01:00Z', type: 'approval_request', title: 'Approve direct push' },
    { timestamp: '2026-05-01T01:02:00Z', type: 'tool_call', tool: 'browser', title: 'Open preview' },
    { timestamp: '2026-05-01T01:03:00Z', type: 'failure', title: 'Build failed' },
    { timestamp: '2026-05-01T01:04:00Z', type: 'commit', title: 'abc123 implement core', commit: 'abc123' },
    { timestamp: '2026-05-01T01:05:00Z', type: 'pull_request', title: 'PR #1', pr: 'https://example.test/pr/1' },
    { timestamp: '2026-05-01T01:06:00Z', type: 'message', title: 'Subagent completed handoff' },
  ].map((event) => JSON.stringify(event)).join('\n');
  const events = jsonlToToolTraceEvents(jsonl);
  assert.deepEqual(events.map((event) => event.category), ['command', 'approval', 'tool', 'error', 'pr_commit', 'pr_commit', 'message']);
});

test('JSONL check evidence overrides a completed lifecycle status', () => {
  const input = [
    { timestamp: '2026-05-01T01:00:00Z', category: 'check', title: 'camel failure', status: 'completed', exitCode: 1 },
    { timestamp: '2026-05-01T01:01:00Z', category: 'check', title: 'snake failure', status: 'completed', exit_code: 1 },
    { timestamp: '2026-05-01T01:02:00Z', category: 'check', title: 'boolean failure', status: 'completed', passed: false },
    { timestamp: '2026-05-01T01:03:00Z', category: 'check', title: 'zero exit', exit_code: 0 },
    { timestamp: '2026-05-01T01:04:00Z', category: 'check', title: 'completed success', status: 'completed' },
  ].map((event) => JSON.stringify(event)).join('\n');

  const events = jsonlToToolTraceEvents(input);
  assert.deepEqual(events.map((event) => event.severity), ['error', 'error', 'error', 'success', 'success']);
  assert.deepEqual(events.map((event) => event.check?.exitCode), [1, 1, undefined, 0, undefined]);
});

test('AgentPulse adapter maps event types with source metadata', () => {
  const events = agentPulseToToolTraceEvents([
    { id: 'a', type: 'exec.completed', timestamp: '2026-05-01T01:00:00Z', payload: { command: 'npm test', status: 'passed' } },
    { id: 'b', type: 'browser.action', timestamp: '2026-05-01T01:01:00Z', payload: { title: 'Clicked deploy' } },
    { id: 'c', type: 'approval.requested', timestamp: '2026-05-01T01:02:00Z', payload: { title: 'Needs review' } },
  ]);
  assert.deepEqual(events.map((event) => event.category), ['command', 'tool', 'approval']);
  assert.equal(events[0].source.kind, 'agentpulse');
});

test('JSONL parser reports physical line numbers across blank lines', () => {
  assert.throws(
    () => parseJsonl('\n  \n{bad}'),
    (error) => error instanceof SyntaxError && /Invalid JSONL at line 3/.test(error.message),
  );
});

test('JSONL adapter reports the physical line and invalid timestamp field', () => {
  const input = [
    '',
    JSON.stringify({ timestamp: '2026-05-01T01:00:00Z', type: 'exec', command: 'npm test' }),
    '',
    JSON.stringify({ timestamp: 'not-a-date', type: 'message', title: 'Finished' }),
  ].join('\n');

  assert.throws(
    () => jsonlToToolTraceEvents(input),
    (error) => /Invalid JSONL event at line 4/.test(error.message)
      && /timestamp/.test(error.message)
      && /"not-a-date"/.test(error.message),
  );
});

test('JSONL adapter reports the physical line and invalid event value', () => {
  assert.throws(
    () => jsonlToToolTraceEvents('\nnull'),
    (error) => /Invalid JSONL event at line 2/.test(error.message)
      && /event/.test(error.message)
      && /null/.test(error.message),
  );
});

test('CLI renders markdown and writes --out files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tooltrace-'));
  const input = join(dir, 'run.jsonl');
  const out = join(dir, 'TOOLTRACE.md');
  await writeFile(input, JSON.stringify({ timestamp: '2026-05-01T01:00:00Z', type: 'exec', command: 'npm test', status: 'passed' }));
  const { stdout } = await execFileAsync(process.execPath, ['src/cli.js', 'summary', input], { cwd: new URL('..', import.meta.url) });
  assert.match(stdout, /Commands/);
  await execFileAsync(process.execPath, ['src/cli.js', 'render', input, '--out', out], { cwd: new URL('..', import.meta.url) });
  assert.match(await readFile(out, 'utf8'), /ToolTrace timeline/);
  const json = await execFileAsync(process.execPath, ['src/cli.js', 'summary', input, '--format', 'json'], { cwd: new URL('..', import.meta.url) });
  assert.equal(JSON.parse(json.stdout).counts.command, 1);
  const piped = await runWithInput(process.execPath, ['src/cli.js', 'summary', '-'], await readFile(input, 'utf8'), { cwd: new URL('..', import.meta.url) });
  assert.match(piped.stdout, /Commands/);
});

test('CLI reports physical lines for malformed JSON and invalid timestamps', async () => {
  const cwd = new URL('..', import.meta.url);

  await assert.rejects(
    runWithInput(process.execPath, ['src/cli.js', 'summary', '-'], '\n\n{bad}', { cwd }),
    /Invalid JSONL at line 3/,
  );
  await assert.rejects(
    runWithInput(
      process.execPath,
      ['src/cli.js', 'summary', '-'],
      `\n${JSON.stringify({ timestamp: 'not-a-date', type: 'message' })}`,
      { cwd },
    ),
    /Invalid JSONL event at line 2:.*timestamp.*"not-a-date"/,
  );
});

test('CLI proof gate can fail builds on blocked runs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tooltrace-gate-'));
  const input = join(dir, 'blocked.jsonl');
  await writeFile(input, JSON.stringify({ timestamp: '2026-05-01T01:00:00Z', type: 'blocked', title: 'Waiting on approval' }));

  await assert.rejects(
    execFileAsync(process.execPath, ['src/cli.js', 'summary', input, '--fail-on', 'blockers'], { cwd: new URL('..', import.meta.url) }),
    /Gate|blocked|process exited/i,
  );

  const json = await execFileAsync(process.execPath, ['src/cli.js', 'summary', input, '--format', 'json'], { cwd: new URL('..', import.meta.url) });
  assert.equal(JSON.parse(json.stdout).gate.counts.blockers, 1);
});

test('CLI --fail-on blockers and any accept resolved blockers but reject unresolved blockers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tooltrace-resolved-blocker-'));
  const resolved = join(dir, 'resolved.jsonl');
  const unresolved = join(dir, 'unresolved.jsonl');
  await writeFile(resolved, JSON.stringify({ timestamp: '2026-05-01T01:00:00Z', type: 'blocker', title: 'Fixture restored', status: 'resolved' }));
  await writeFile(unresolved, JSON.stringify({ timestamp: '2026-05-01T01:00:00Z', type: 'blocker', title: 'Fixture missing' }));
  const cwd = new URL('..', import.meta.url);

  for (const mode of ['blockers', 'any']) {
    const result = await execFileAsync(process.execPath, ['src/cli.js', 'summary', resolved, '--format', 'json', '--fail-on', mode], { cwd });
    const output = JSON.parse(result.stdout);
    assert.equal(output.counts.blocking, 0);
    assert.equal(output.gate.counts.blockers, 0);
    assert.equal(output.gate.passed, true);

    await assert.rejects(
      execFileAsync(process.execPath, ['src/cli.js', 'summary', unresolved, '--format', 'json', '--fail-on', mode], { cwd }),
      (error) => error.code === 2 && JSON.parse(error.stdout).gate.counts.blockers === 1,
    );
  }
});

test('CLI exits 2 for completed checks with failed result evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tooltrace-check-gate-'));
  const input = join(dir, 'failed-check.jsonl');
  await writeFile(input, JSON.stringify({
    timestamp: '2026-05-01T01:00:00Z',
    category: 'check',
    title: 'npm test',
    status: 'completed',
    exitCode: 1,
  }));

  for (const mode of ['failed-checks', 'any']) {
    await assert.rejects(
      execFileAsync(process.execPath, ['src/cli.js', 'summary', input, '--format', 'json', '--fail-on', mode], { cwd: new URL('..', import.meta.url) }),
      (error) => {
        const output = JSON.parse(error.stdout);
        return error.code === 2
          && output.events[0].severity === 'error'
          && output.checklist.find((item) => item.id === 'checks-passed').passed === false
          && output.gate.passed === false
          && output.gate.counts.failedChecks === 1;
      },
    );
  }
});

test('CLI rejects missing and option-like option values', async () => {
  const cwd = new URL('..', import.meta.url);
  for (const args of [
    ['summary', 'demo/crewcmd-run.jsonl', '--out'],
    ['summary', 'demo/crewcmd-run.jsonl', '--format', '--out', 'result.md'],
    ['summary', 'demo/crewcmd-run.jsonl', '--fail-on', '--require-completion'],
  ]) {
    await assert.rejects(
      execFileAsync(process.execPath, ['src/cli.js', ...args], { cwd }),
      (error) => error.code === 1 && /requires a value/.test(error.stderr),
    );
  }
});

test('CLI enforces command-specific options', async () => {
  const cwd = new URL('..', import.meta.url);
  for (const optionArgs of [
    ['--format', 'json'],
    ['--fail-on', 'any'],
    ['--require-completion'],
  ]) {
    await assert.rejects(
      execFileAsync(process.execPath, ['src/cli.js', 'render', 'demo/crewcmd-run.jsonl', ...optionArgs], { cwd }),
      (error) => error.code === 1 && /not supported by the render command/.test(error.stderr),
    );
  }
});

test('CLI accepts summary options before and after the input', async () => {
  const cwd = new URL('..', import.meta.url);
  const before = await execFileAsync(process.execPath, ['src/cli.js', 'summary', '--format', 'json', 'demo/crewcmd-run.jsonl'], { cwd });
  assert.equal(JSON.parse(before.stdout).counts.command, 1);

  await assert.rejects(
    execFileAsync(process.execPath, ['src/cli.js', 'summary', '--fail-on', 'blockers', 'tests/fixtures/blocked-run.jsonl'], { cwd }),
    (error) => error.code === 2 && /Blockers/.test(error.stdout),
  );
});
