# Releasing ToolTrace

ToolTrace publishes the same tarball to npm and the GitHub release from the
tag-triggered `Release` workflow. Tags must use the package version as
`v<version>` (for example, package version `0.2.0` uses tag `v0.2.0`).

## One-time npm configuration

Configure an npm trusted publisher for the `tooltrace` package with:

- organization or user: `rogerchappel`
- repository: `tooltrace`
- workflow filename: `release.yml`
- GitHub environment: `npm`

Create the `npm` environment in the GitHub repository before the first publish.
No long-lived `NPM_TOKEN` repository secret is required. The workflow requests
an OIDC token through `id-token: write`, installs a current npm CLI, and uses
`npm publish --provenance`.

## Release procedure

1. Update `package.json` and `package-lock.json` to the intended version.
2. Update `CHANGELOG.md` and merge the release commit to the default branch.
3. Run `npm ci`, `npm run release:contract`, and `npm run release:check` locally.
4. Create and push the matching `v<version>` tag.
5. Confirm the workflow publishes to npm, verifies an exact-version install,
   and creates the GitHub release with the same tarball.
6. Confirm `npm view tooltrace@<version> version` and
   `npm install tooltrace@<version>` resolve the released version.

## Failure and recovery

npm versions are immutable. Do not delete and recreate a tag or try to publish
different contents under a version that npm accepted.

If publishing fails before npm accepts the version, fix the configuration or
workflow on the default branch, move the tag to that reviewed fix only if no
release artifact was published, and rerun the workflow. If npm accepted the
version but later verification or GitHub release creation failed, rerun the
workflow: it detects the existing exact version, skips the immutable publish,
then verifies the registry install and recreates or updates the GitHub release.
If the accepted npm package itself is wrong, deprecate that version and publish
a corrected patch version.
