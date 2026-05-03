# Contributing

Thanks for helping improve `tooltrace`.

This project values small, reviewable contributions with clear verification.

## Issues

Before opening an issue:

- Search existing issues.
- Confirm the issue applies to `tooltrace`.
- Include enough context for maintainers to understand or reproduce the request.

Bug reports should include:

- What happened.
- What you expected.
- Steps to reproduce.
- Relevant logs, screenshots, or files.
- The smallest verification step that demonstrates the issue.

Feature requests should include:

- The use case.
- Why the current project does not solve it.
- Risks or compatibility concerns.
- Suggested files or behavior that may need to change.

## Pull Requests

Pull requests should:

- Focus on one reviewable intent.
- Use a branch.
- Follow Conventional Commits.
- Include tests or verification appropriate to the change.
- Update documentation when behavior or usage changes.
- Avoid unrelated formatting or dependency churn.
- Avoid secrets, private contact details, and project-specific sensitive information.

## Review Pack

Use this format for meaningful changes:

```md
## Review Pack
Repo:
Branch:
PR:
Task:
Status: done / blocked / needs review
Summary:
Commits:
Files changed:
Verification:
Risk level:
Rollback plan:
Human decision needed:
Next recommended task:
```

## Verification

Every contribution should include verification.

Examples:

- Documentation: inspect rendered Markdown or review the diff.
- Tests: run the targeted test command.
- Types: run the project typecheck.
- Build: run the smallest build command that covers the change.
- Manual QA: provide exact steps and observed result.

If verification cannot be run, explain why and provide the exact command maintainers should run.

## Maintainer Review

Maintainers may request narrower scope, clearer verification, additional tests, or safer defaults before merging.

## Fixture-first changes

When changing normalization, adapters, summaries, or CLI output, add or update a fixture in `tests/fixtures/` first. Fixtures should be redacted, local, and small enough to read in a review. Prefer one realistic event sequence over many synthetic one-liners.

## Commit style

Keep commits focused around one behavior, test, or document. ToolTrace is a proof-of-work project, so the history should be reviewable too.
