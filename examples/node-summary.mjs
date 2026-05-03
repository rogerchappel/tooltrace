import { readFile } from 'node:fs/promises';
import { createProofSummary, jsonlToToolTraceEvents } from '../src/index.js';

const file = process.argv[2] ?? new URL('../tests/fixtures/crewcmd-success.jsonl', import.meta.url);
const events = jsonlToToolTraceEvents(await readFile(file, 'utf8'));
console.log(createProofSummary(events));
