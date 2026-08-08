# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Fixed

- Check normalization and proof gates now honor `passed: false` and nonzero
  `exitCode`/`exit_code` evidence even when lifecycle status is `completed`.
- Restored the `tooltrace/react` entry point so its timeline, review checklist,
  and proof summary components can be imported and rendered from the package.

### Added

- Initial project setup.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/tooltrace/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/tooltrace/releases/latest`

Replace placeholder links once the first release tag exists.
