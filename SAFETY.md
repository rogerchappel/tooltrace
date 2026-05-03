# Safety and privacy

ToolTrace is designed for local-first agent review. It should make proof of work legible without becoming a secret exfiltration path.

## Defaults

- Core APIs make no network calls.
- Generic credential and token patterns are redacted before summaries are generated.
- Raw source events can be omitted with `includeRaw: false` and are omitted by the JSONL adapter by default.
- Oversized text fields are truncated to keep review artifacts readable.

## Integrator responsibilities

- Add product-specific redaction patterns for customer data, internal URLs, account IDs, or regulated data.
- Treat generated timelines as review artifacts, not as authorization decisions.
- Keep approval events descriptive; ToolTrace does not approve or reject work on its own.
- Avoid pasting private logs into public demos unless they have been reviewed.

## Reporting issues

Security-sensitive issues should follow [SECURITY.md](SECURITY.md). For regular bugs, open an issue with a minimal redacted fixture.
