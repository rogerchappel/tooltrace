import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { agentPulseToToolTraceEvents, jsonlToToolTraceEvents, parseJsonl } from '../src/index.js';

const execFileAsync = promisify(execFile);

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

test('AgentPulse adapter maps event types with source metadata', () => {
  const events = agentPulseToToolTraceEvents([
    { id: 'a', type: 'exec.completed', timestamp: '2026-05-01T01:00:00Z', payload: { command: 'npm test', status: 'passed' } },
    { id: 'b', type: 'browser.action', timestamp: '2026-05-01T01:01:00Z', payload: { title: 'Clicked deploy' } },
    { id: 'c', type: 'approval.requested', timestamp: '2026-05-01T01:02:00Z', payload: { title: 'Needs review' } },
  ]);
  assert.deepEqual(events.map((event) => event.category), ['command', 'tool', 'approval']);
  assert.equal(events[0].source.kind, 'agentpulse');
});

test('JSONL parser reports useful line errors', () => {
  assert.throws(() => parseJsonl('{bad}'), /line 1/);
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
});
