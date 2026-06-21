#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createProofGate, createProofSummary, createTimeline, jsonlToToolTraceEvents } from './index.js';

function usage(exitCode = 0) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`tooltrace — render readable proof from JSONL\n\nUsage:\n  tooltrace summary <file.jsonl> [--format markdown|slack|json] [--fail-on blockers|approvals|failed-checks|any]\n  tooltrace render <file.jsonl> [--out TOOLTRACE.md]\n\nOptions:\n  --out <path>          Write markdown output to a file instead of stdout\n  --format <format>     Summary format: markdown, slack, or json\n  --fail-on <mode>      Exit non-zero when proof contains blockers, approvals, failed checks, or any gate failure\n  --require-completion  Treat missing completion proof as a gate failure\n  --help               Show this help\n`);
  process.exit(exitCode);
}

function takeFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  args.splice(index, 2);
  return value;
}

function renderTimeline(events) {
  const timeline = createTimeline(events, { includeRaw: false });
  const lines = ['# ToolTrace timeline', ''];
  for (const group of timeline.groups) {
    lines.push(`## ${group.title} (${group.severity})`, '');
    for (const event of group.events) {
      const time = event.timestamp.replace('T', ' ').replace('.000Z', 'Z');
      lines.push(`- [${time}] **${event.category}** ${event.title}`);
      if (event.body) lines.push(`  ${event.body}`);
    }
    lines.push('');
  }
  lines.push(createProofSummary(timeline));
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) usage(args.length === 0 ? 1 : 0);
  const command = args.shift();
  const out = takeFlag(args, '--out');
  const format = takeFlag(args, '--format') ?? 'markdown';
  const failOn = takeFlag(args, '--fail-on');
  const requireCompletion = args.includes('--require-completion');
  if (requireCompletion) args.splice(args.indexOf('--require-completion'), 1);
  const file = args.shift();
  if (!['summary', 'render'].includes(command)) throw new Error(`Unknown command: ${command}`);
  if (!file) throw new Error('Missing JSONL input file');
  if (args.length) throw new Error(`Unexpected argument(s): ${args.join(' ')}`);

  const text = file === '-' ? await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  }) : await readFile(file, 'utf8');
  const events = jsonlToToolTraceEvents(text, { includeRaw: false });
  if (!['markdown', 'slack', 'json'].includes(format)) throw new Error(`Unsupported format: ${format}`);
  const timeline = createTimeline(events, { alreadyNormalized: true });
  const gate = createProofGate(timeline, { requireCompletion });
  const output = command === 'summary' && format === 'json'
    ? `${JSON.stringify({ ...timeline, gate }, null, 2)}\n`
    : command === 'summary' ? createProofSummary(timeline, { format, includeGate: Boolean(failOn), requireCompletion }) : renderTimeline(events);
  if (out) await writeFile(out, output.endsWith('\n') ? output : `${output}\n`);
  else process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);
  if (command === 'summary' && failOn && shouldFail(gate, failOn)) process.exitCode = 2;
}

function shouldFail(gate, mode) {
  if (mode === 'any') return !gate.passed;
  if (mode === 'blockers') return gate.counts.blockers > 0;
  if (mode === 'approvals') return gate.counts.approvals > 0;
  if (mode === 'failed-checks') return gate.counts.failedChecks > 0;
  throw new Error(`Unsupported --fail-on mode: ${mode}`);
}

main().catch((error) => {
  process.stderr.write(`tooltrace: ${error.message}\n`);
  process.exit(1);
});
