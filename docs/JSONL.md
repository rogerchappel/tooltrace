# JSONL input format

ToolTrace accepts one JSON object per line. Unknown fields are preserved in `raw` unless `includeRaw: false` is used.

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
