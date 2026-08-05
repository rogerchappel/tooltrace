# JSONL input format

ToolTrace accepts one JSON object per line. Unknown fields are preserved in `raw` unless `includeRaw: false` is used.

Blank lines are allowed. Parser and normalization errors report the physical source line, including
blank lines, so diagnostics remain stable when files are spaced for readability. Event-shape errors
also name the invalid field and value when available; for example:

```text
tooltrace: Invalid JSONL event at line 4: Invalid timestamp value "not-a-date"
```

## Common fields

| Field | Purpose |
| --- | --- |
| `timestamp`, `time`, `ts` | Event time; sorted ascending. |
| `category`, `type`, `kind` | Event type or adapter alias. |
| `title`, `name`, `command`, `tool` | Short human label. |
| `body`, `message`, `summary`, `output`, `error` | Longer detail. |
| `groupId`, `runId`, `parentId` | Grouping and provenance. |
| `status`, `outcome`, `severity` | Used to infer review tone. |

## Supported categories

`message`, `command`, `tool`, `file_change`, `check`, `approval`, `error`, `retry`, `blocker`, `pr_commit`, `completion_proof`.

## Minimal example

```jsonl
{"timestamp":"2026-05-01T02:00:00Z","type":"exec","command":"npm test","status":"passed","exitCode":0}
{"timestamp":"2026-05-01T02:01:00Z","category":"completion_proof","title":"Ready for review"}
```

## Proof gates

`tooltrace summary run.jsonl --fail-on any --require-completion` exits with status `2` when unresolved proof remains. Gate failures include failed `check` events, `blocker` events, unresolved `approval` events, and missing completion proof when requested.
