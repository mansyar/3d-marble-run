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
- [x] Task: Add the validated tag release workflow *(e72c2f0)*
  - [x] Trigger on `v*` tags.
  - [x] Run frozen install, release validation, tests, Biome, TypeScript, and
    production build.
  - [x] Stop all publication when validation or quality checks fail.
  - [x] Create a GitHub Release with GitHub-generated notes.
  - [x] Call the Pages and GHCR workflows only after the quality gate.
  - [x] Configure least-privilege permissions for contents, Pages, OIDC, and
    packages.
  - Notes: The tag orchestrator validates before quality checks; every
    publication job depends on `quality`, and each job has only the token
    permissions it needs.
  - Verify: 92 tests, Biome, TypeScript, production build, and whitespace
    checks pass. Local actionlint was unavailable; workflow structure was
    reviewed against GitHub reusable-workflow syntax.
- [x] Task: Align release image metadata *(f0fee48)*
  - [x] Publish the exact `X.Y.Z` image tag, `latest`, and SHA tag.
  - [x] Preserve OCI version, revision, and source labels.
  - [x] Verify tag-triggered reusable workflow context produces the intended
    image tags.
  - Notes: Docker Metadata now uses `type=semver,pattern={{version}}` for
    the immutable release tag, enables `latest` for release tags and the
    default branch, and retains the SHA tag and generated OCI labels.
  - Verify: 92 tests, Biome, TypeScript, production build, and whitespace
    checks pass; metadata action semantics were reviewed for reusable tag
    context.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [checkpoint: f0fee48]
  - [x] Run automated tests, coverage, Biome, TypeScript, builds, and release validation.
  - [x] Review workflow triggers, dependencies, permissions, and image tags.
  - [x] Complete desktop/mobile preview and Pages-base-path verification.
  - Notes: User confirmed desktop/mobile and repository-base-path smoke tests
    passed. Full verification is attached as a Git note to `f0fee48`.
  - Verify: 92 tests passed; standard and base-path builds stayed within the
    documented JavaScript budget. Remote tag execution remains a post-merge
    verification item.

## Phase 3 · In-App About & Version Surface

- [x] Task: Implement the accessible About dialog *(81488da)*
  - [x] Add an About button to the existing simulation-controls panel.
  - [x] Add a modal showing `Marblescape` and `v${APP_VERSION}`.
  - [x] Support close button, Escape-to-close, focus return, and touch-sized
    controls.
  - [x] Add styling consistent with the existing light HUD and mobile layout.
  - [x] Keep the runtime fully offline with no new network dependency.
  - Notes: The native dialog owns its accessibility and focus lifecycle; the
    HUD owns only the trigger and `main.ts` passes the package-derived version.
  - Verify: 92 tests, Biome, TypeScript, build, and diff checks pass.
- [x] Task: Wire and manually verify the About experience *(81488da)*
  - [x] Connect the dialog to `main.ts` without duplicating orchestration logic.
  - [x] Verify desktop mouse and keyboard behavior.
  - [x] Verify mobile touch behavior and layout at narrow viewport sizes.
  - [x] Verify the version shown matches `package.json`.
  - Notes: User confirmed desktop and mobile interaction checks passed,
    including Close/Escape focus return and the package-derived `v0.1.0`.
  - Verify: Manual checks and the automated suite passed; full details are
    attached as a Git note to `81488da`.
- [~] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

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
