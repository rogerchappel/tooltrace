# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Fixed

- Resolved, completed, and approved blocker events no longer count as active
  blockers or fail proof gates, checklists, and CLI blocker modes.

## [0.1.1] - 2026-08-16

Prepared for publication; this version is not yet available from npm or as a
GitHub release.

### Fixed

- Check normalization and proof gates now honor `passed: false` and nonzero
  `exitCode`/`exit_code` evidence even when lifecycle status is `completed`.
- Restored the `tooltrace/react` entry point so its timeline, review checklist,
  and proof summary components can be imported and rendered from the package.

## [0.1.0] - 2026-05-04

### Added

- Initial project setup.

[Unreleased]: https://github.com/rogerchappel/tooltrace/compare/v0.1.0...HEAD
[0.1.1]: https://github.com/rogerchappel/tooltrace/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rogerchappel/tooltrace/releases/tag/v0.1.0
