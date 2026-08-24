# Specification: Tagged Release Pipeline & Application Versioning

## Overview

Add a production release contract for Marblescape based on stable SemVer Git
tags. The existing `package.json` version remains authoritative, and all
release artifacts must derive from and validate against it.

## Functional Requirements

### FR-1 · Version Contract

- Use stable versions in `MAJOR.MINOR.PATCH` format.
- A release tag must be `vMAJOR.MINOR.PATCH`.
- The tag must exactly match `v${package.json.version}`.
- A mismatch must fail before any deployment, image publication, or GitHub
  Release creation.
- Document `pnpm version patch|minor|major` as the maintainer workflow.
- Do not introduce a separate `VERSION` file or automated release-PR system.

### FR-2 · Tag-Triggered Release Pipeline

- Pushing a valid `v*` tag starts the release pipeline.
- The quality gate must run:
  - frozen dependency installation
  - Vitest
  - Biome
  - TypeScript type-check
  - production build
- Artifact publication begins only after the quality gate succeeds.
- GitHub Release notes use GitHub-generated notes from changes since the
  previous tag.
- Existing `master` and manual deployment paths remain available for
  development and operations.

### FR-3 · GitHub Pages Deployment

- A valid release tag deploys the production static site.
- The repository-name base path must continue to work.
- The tag pipeline must not create duplicate uncontrolled tag deployments if
  existing workflows are refactored into reusable jobs.

### FR-4 · GHCR Container Publication

- A valid release tag publishes:
  - the exact immutable version tag, such as `0.2.0`
  - `latest`
  - a commit SHA tag
- OCI image metadata must include the release version, revision, and source
  repository.
- Existing optional Coolify behavior remains unchanged unless explicitly
  enabled by its current configuration.

### FR-5 · In-App Version Visibility

- The build must derive the runtime version from `package.json`; no duplicated
  hard-coded version is allowed.
- Add an About button to the existing simulation-controls surface.
- The button opens an accessible modal showing the Marblescape name and
  `vX.Y.Z`.
- The modal must support a clear close action, Escape-to-close, focus return,
  and mobile-sized touch targets.
- The version display must not add runtime network dependencies or interfere
  with the existing HUD.

### FR-6 · Documentation

- Update the README with:
  - version-bump commands
  - tag-push workflow
  - release artifacts
  - image-tag examples
  - failure behavior for mismatched versions
- Document the release pipeline's required GitHub permissions and settings
  where relevant.

## Non-Functional Requirements

- Preserve the offline, static-site runtime model.
- Use least-privilege GitHub Actions permissions.
- Keep the current bundle budget and quality gates intact.
- Follow the existing workflow's TDD requirements for any new logic-bearing
  validation.
- Verify the About surface manually on desktop and mobile.

## Acceptance Criteria

- `package.json` at `0.2.0` accepts `v0.2.0`.
- A mismatched tag such as `v0.2.1` fails before publication.
- A valid tag runs all quality checks and publishes:
  - a generated-notes GitHub Release
  - GitHub Pages
  - GHCR version, `latest`, and SHA images
- The deployed site loads correctly under its Pages base path.
- The About modal displays the exact package version and works with mouse,
  keyboard, and touch.
- README instructions allow a maintainer to perform the next patch, minor, or
  major release without guesswork.
- Existing tests, Biome, TypeScript, and build checks remain passing.

## Out of Scope

- npm package publication
- prerelease channels
- Changesets or release-PR automation
- new runtime or product features
- backend, accounts, or online sharing
- redesigning the existing HUD
- changing Coolify's current opt-in policy
