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
- [~] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3 · Documentation & final verification

- [ ] Task: Document the release-only deployment policy
  - [ ] Explain that master pushes run CI only and do not publish artifacts.
  - [ ] Document valid tag release outputs and quality-gate ordering.
  - [ ] Document default-branch-only manual emergency dispatches.
  - [ ] Document release-triggered optional Coolify behavior and existing
    configuration requirements.
- [ ] Task: Perform local and remote release-policy verification
  - [ ] Run matching and mismatched release-tag validation checks.
  - [ ] Run the complete local tests, Biome, TypeScript, production build, and
    preview checks.
  - [ ] Verify a master push runs CI without Pages/GHCR publication.
  - [ ] Verify a valid release tag runs quality and then the configured outputs.
  - [ ] Record any GitHub Actions annotations or follow-up maintenance items.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
