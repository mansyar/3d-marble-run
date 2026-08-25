# Specification: Release-Only Deployment Policy & Master CI

## Overview

Change Marblescape's deployment policy so automatic GitHub Pages deployment and
GHCR publication occur only from validated `vMAJOR.MINOR.PATCH` release tags.
Preserve explicit manual emergency dispatches, restricted to the repository
default branch, and add master-branch CI checks without publishing artifacts.

## Functional Requirements

### Master push behavior

- Remove `push: branches: [master]` triggers from
  `.github/workflows/deploy-pages.yml` and
  `.github/workflows/publish-container.yml`.
- A master push must not deploy Pages, publish GHCR images, or trigger Coolify.
- Add a CI-only workflow for master pushes that runs frozen install, tests,
  Biome, TypeScript, and the production build.

### Release behavior

- Preserve the tag-only `.github/workflows/release.yml` trigger for `v*` tags.
- Preserve exact package/tag validation before publication.
- After the `quality` job succeeds, GitHub Release generation, Pages
  deployment, GHCR publication, and optional Coolify redeployment may proceed.
- Preserve generated release notes, the repository-name Pages base path, GHCR
  `X.Y.Z`/`latest`/SHA tags, OCI labels, and least-privilege permissions.

### Manual emergency behavior

- Preserve `workflow_dispatch` for Pages and GHCR.
- Allow manual publication only when dispatched from the repository default
  branch.
- Treat manual dispatch as an explicit operator override; it does not require
  a release tag or the release workflow's quality job.
- A manual dispatch targeting another ref must not publish.

### Coolify behavior

- When enabled and credentials are configured, trigger Coolify after a
  successful GHCR publication from a validated release or eligible manual
  default-branch run.
- Do not trigger Coolify from master pushes.

### Reusable workflow behavior

- Preserve `workflow_call` entry points for release orchestration.
- Do not introduce duplicate tag publication triggers.
- Keep current build, authentication, retry, and image metadata behavior unless
  a trigger-policy change requires an adjustment.

## Non-Functional Requirements

- Maintain the offline/static runtime; no application-code changes are needed.
- Keep workflow permissions least-privilege.
- Keep checks deterministic with Node 22, pnpm 11, and frozen lockfile installs.
- Keep the documented bundle budget and current browser/mobile support unchanged.
- Maintain readable GitHub Actions YAML and existing naming conventions.

## Acceptance Criteria

1. A push to `master` runs CI checks but does not start Pages deployment, GHCR
   publication, or Coolify.
2. A valid matching release tag runs the quality gate and then produces the
   configured GitHub Release, Pages, GHCR, and optional Coolify outputs.
3. A malformed or mismatched `v*` tag fails before any publication job runs.
4. Manual Pages/GHCR dispatch from the default branch remains available.
5. Manual dispatch from a non-default branch cannot publish.
6. Release images retain exact version, `latest`, SHA, and OCI metadata tags.
7. Existing release validation, tests, Biome, TypeScript, build, and manual
   desktop/mobile behavior remain passing.
8. Workflow changes are documented in the README runbook.
9. Automated workflow checks and local quality gates pass.

## Out of Scope

- Changing the package/tag version contract or release-note format.
- New product features, UI changes, backend/online functionality, or npm
  publishing.
- Pull-request CI unless separately requested.
- New deployment providers or changes to Coolify credentials/webhook semantics.
- Changes to Pages base paths, GHCR image naming, or release permissions beyond
  trigger eligibility.
