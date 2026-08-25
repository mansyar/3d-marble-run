# Implementation Plan: Release-Only Deployment Policy & Master CI

## Phase 1 · Master CI-only validation

- [x] Task: Add the master-push CI-only workflow
  - [x] Create a workflow triggered by pushes to `master` only.
  - [x] Run pnpm 11/Node 22 setup with a frozen lockfile install.
  - [x] Run Vitest, Biome, TypeScript, and the production build.
  - [x] Keep deployment, package publication, and deployment secrets out of the
    CI-only workflow.
  - Commit: `ce1271a` (`ci(release): Add master-only CI workflow`); Git note attached.
- [x] Task: Validate the CI-only workflow contract
  - [x] Review trigger, permissions, steps, and failure behavior.
  - [x] Run local tests, Biome, TypeScript, build, and diff checks.
  - [x] Run workflow syntax validation when `actionlint` is available, otherwise
    record the manual YAML review and remote GitHub result.
  - Verification: 92 tests passed; Biome, TypeScript, production build, and
    `git diff --check` passed. `actionlint` was unavailable; manual workflow
    review passed. Build measured 3,422.17 kB raw / 1,240.30 kB gzip.
  - Commit: validation is recorded in the Phase 1 plan update; implementation
    commit is `ce1271a` with a Git note.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [checkpoint: ce1271a]
  - Automated verification and manual desktop/mobile confirmation are recorded
    in the full Git note appended to `ce1271a`.
  - Remote CI execution remains post-push verification.

## Phase 2 · Release-only publication policy

- [x] Task: Remove automatic master publication and guard manual dispatch
  - [x] Remove the master push trigger from the Pages reusable workflow.
  - [x] Remove the master push trigger from the container reusable workflow.
  - [x] Preserve `workflow_call` and manual dispatch entry points.
  - [x] Restrict manual publication jobs to the repository default branch.
  - [x] Preserve release-tag calls, Pages base-path handling, GHCR metadata,
    permissions, and existing authentication behavior.
  - Commit: `4f64506` (`ci(release): Make publication release-only`); Git note attached.
- [x] Task: Route optional Coolify deployment through eligible outputs
  - [x] Keep Coolify disabled unless its existing opt-in setting and credentials
    are present.
  - [x] Trigger it after successful GHCR publication for validated release calls
    and eligible manual default-branch runs.
  - [x] Ensure master pushes cannot trigger Coolify.
  - [x] Preserve the existing webhook, bearer token, and retry behavior.
  - Commit: `6503e8b` (`ci(release): Trigger Coolify after releases`); Git note attached.
- [x] Task: Verify release orchestration and publication ordering
  - [x] Confirm `release.yml` remains tag-only and validates before publication.
  - [x] Confirm GitHub Release, Pages, GHCR, and Coolify depend on `quality` as
    specified and no standalone tag publisher remains.
  - [x] Confirm malformed or mismatched tags cannot reach publication jobs.
  - [x] Confirm exact version, `latest`, SHA, and OCI image metadata behavior.
  - Verification: 92 tests, Biome, TypeScript, production build, matching
    `v0.1.0` acceptance, expected `v0.1.1` rejection, and `git diff --check`
    passed. Build measured 3,422.17 kB raw / 1,240.30 kB gzip; actionlint was
    unavailable and workflow semantics were manually reviewed.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [checkpoint: 6503e8b]
  - Automated verification and workflow review are recorded in the full Git
    note appended to `6503e8b`.
  - User confirmed desktop and mobile/narrow-viewport preview smoke tests.
  - Remote CI and release execution remain post-push verification.

## Phase 3 · Documentation & final verification

- [x] Task: Document the release-only deployment policy
  - [x] Explain that master pushes run CI only and do not publish artifacts.
  - [x] Document valid tag release outputs and quality-gate ordering.
  - [x] Document default-branch-only manual emergency dispatches.
  - [x] Document release-triggered optional Coolify behavior and existing
    configuration requirements.
  - Commit: `8cd30aa` (`docs(release): Document release-only deployment policy`); Git note attached.
- [x] Task: Perform local and remote release-policy verification
  - [x] Run matching and mismatched release-tag validation checks.
  - [x] Run the complete local tests, Biome, TypeScript, production build, and
    preview checks.
    - Verification: matching `v0.1.1` passed; mismatched `v0.1.0` was rejected;
      92 tests, Biome, TypeScript, build, `git diff --check`, and preview HTTP
      smoke check passed. Build measured 3,422.17 kB raw / 1,240.30 kB gzip.
  - [x] Verify a master push runs CI without Pages/GHCR publication.
    - Verification: master CI run `32798476496` passed; no publication workflow
      ran for that push.
  - [x] Verify a valid release tag runs quality and then the configured outputs.
    - Verification: release run `32798523908` passed quality, GitHub Release,
      Pages, GHCR, and optional Coolify. GHCR logs confirmed `0.1.1`, `latest`,
      and `sha-f94b836` tags plus OCI version/revision/source labels. The
      `github-pages` environment allows `master` and `v*`.
  - [x] Record any GitHub Actions annotations or follow-up maintenance items.
    - Verification: non-blocking Node.js 20 deprecation annotations recorded;
      local `actionlint` was unavailable. GitHub API package-tag inspection was
      unavailable because the local token lacks `read:packages`; workflow logs
      provided the tag and label evidence.
  - Commits: `77a6194`, `9b6a07b`, `4f7fb6f`, and `f94b836`; Git notes attached.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [checkpoint: f94b836]
  - Full automated, remote, and manual verification is recorded in the Git note
    appended to `f94b836`.
  - User confirmed the live Pages URL on desktop and mobile/narrow viewport,
    including editor loading, piece editing, marble interaction, About dialog,
    touch-sized controls, and canvas interaction.

## Review Fixes

- [x] Task: Apply review suggestions (`c448a6c`)
  - [x] Correct the release runbook examples for the shipped version.
  - [x] Pass only the Coolify secrets to the reusable container workflow.
  - Verification: 92 tests, Biome, TypeScript, production build, matching
    `v0.1.1` validation, expected `v0.1.0` rejection, and `git diff --check`
    passed. Build measured 3,422.17 kB raw / 1,240.30 kB gzip.
  - Commit: `c448a6c`; Git note attached.
