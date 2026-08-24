# Implementation Plan: Tagged Release Pipeline & Application Versioning

Progress notes are appended under completed tasks per `workflow.md`. One
commit and Git note per task.

## Phase 1 · Version Contract & Build Exposure

- [x] Task: Write failing tests for stable release-tag validation *(d55bf12)*
  - [x] Cover matching `v0.1.0` / `0.1.0` cases.
  - [x] Cover mismatched versions, malformed tags, and prerelease tags.
  - [x] Run the targeted tests and confirm the red phase.
  - Notes: TDD red phase confirmed with the missing validator module, then
    expanded coverage to CLI success/failure and actionable validation errors.
  - Verify: 8 targeted tests passed; validator coverage is 84.21% statements,
    92.3% branches, and 80% functions. Full suite (91 tests), Biome, and
    TypeScript also passed.
- [x] Task: Implement the package/tag version contract *(d6dc4e8)*
  - [x] Add a small Node release-check module usable by CI and local commands.
  - [x] Add `pnpm check:release`.
  - [x] Validate stable SemVer syntax and exact `v${package.json.version}`
    matching.
  - [x] Make validation failures return a non-zero exit code with an
    actionable message.
  - [x] Rerun release-check tests and the full test suite.
  - Notes: The validator implementation was introduced during the preceding
    red-green test task; this task wires it into the package-level command.
  - Verify: `pnpm check:release -- v0.1.0` succeeds and `v0.1.1` fails with
    the expected version. Full tests (91), Biome, TypeScript, and production
    build pass.
- [x] Task: Expose the package version to the browser build *(e5889fd)*
  - [x] Enable package JSON version importing under strict TypeScript.
  - [x] Add a single `APP_VERSION` export derived from `package.json`.
  - [x] Add a test ensuring the exported version matches package metadata.
  - Notes: `src/version.ts` is now the single browser-facing version source;
    no duplicated application version string was added.
  - Verify: Version test coverage is 100%; full tests (92), Biome, TypeScript,
    and production build pass.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [checkpoint: e5889fd]
  - [x] Run automated tests, coverage, Biome, TypeScript, build, and release validation.
  - [x] Complete desktop preview smoke verification.
  - [x] Complete mobile preview smoke verification.
  - Notes: User confirmed desktop and mobile preview checks passed. Full
    verification is attached as a Git note to `e5889fd`.
  - Verify: 92 tests passed; release/version coverage exceeded the project
    target; build remained within the documented JavaScript budget.

## Phase 2 · Gated Tag Release Pipeline

- [x] Task: Make existing Pages and container workflows reusable *(f0761c6)*
  - [x] Preserve current `master` and manual triggers.
  - [x] Add reusable workflow entry points for release orchestration.
  - [x] Prevent duplicate standalone tag publication.
  - [x] Preserve the existing optional Coolify behavior.
  - Notes: Pages and GHCR workflows now expose `workflow_call`; only the
    standalone container `v*` trigger was removed, so tag publication can be
    gated centrally without changing master/manual or Coolify behavior.
  - Verify: Workflow diff is whitespace-clean; 92 tests, Biome, TypeScript,
    and production build pass.
- [ ] Task: Add the validated tag release workflow
  - [ ] Trigger on `v*` tags.
  - [ ] Run frozen install, release validation, tests, Biome, TypeScript, and
    production build.
  - [ ] Stop all publication when validation or quality checks fail.
  - [ ] Create a GitHub Release with GitHub-generated notes.
  - [ ] Call the Pages and GHCR workflows only after the quality gate.
  - [ ] Configure least-privilege permissions for contents, Pages, OIDC, and
    packages.
- [ ] Task: Align release image metadata
  - [ ] Publish the exact `X.Y.Z` image tag, `latest`, and SHA tag.
  - [ ] Preserve OCI version, revision, and source labels.
  - [ ] Verify tag-triggered reusable workflow context produces the intended
    image tags.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3 · In-App About & Version Surface

- [ ] Task: Implement the accessible About dialog
  - [ ] Add an About button to the existing simulation-controls panel.
  - [ ] Add a modal showing `Marblescape` and `v${APP_VERSION}`.
  - [ ] Support close button, Escape-to-close, focus return, and touch-sized
    controls.
  - [ ] Add styling consistent with the existing light HUD and mobile layout.
  - [ ] Keep the runtime fully offline with no new network dependency.
- [ ] Task: Wire and manually verify the About experience
  - [ ] Connect the dialog to `main.ts` without duplicating orchestration logic.
  - [ ] Verify desktop mouse and keyboard behavior.
  - [ ] Verify mobile touch behavior and layout at narrow viewport sizes.
  - [ ] Verify the version shown matches `package.json`.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4 · Documentation & Release Rehearsal

- [ ] Task: Document the release runbook
  - [ ] Document `pnpm version patch|minor|major`.
  - [ ] Document pushing the generated commit and `vX.Y.Z` tag.
  - [ ] Document Pages, GitHub Release, and GHCR outputs.
  - [ ] Document mismatch failures and required GitHub configuration.
  - [ ] Document exact and `latest` container pull examples.
- [ ] Task: Perform local release rehearsal and final quality gates
  - [ ] Confirm matching `v0.1.0` validation succeeds.
  - [ ] Confirm a mismatched tag fails.
  - [ ] Run tests, Biome, TypeScript, production build, and preview checks.
  - [ ] Review workflow permissions and tag conditions.
  - [ ] Record any remote GitHub Actions verification needed after merge.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
