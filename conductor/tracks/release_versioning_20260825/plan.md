# Implementation Plan: Tagged Release Pipeline & Application Versioning

Progress notes are appended under completed tasks per `workflow.md`. One
commit and Git note per task.

## Phase 1 · Version Contract & Build Exposure

- [ ] Task: Write failing tests for stable release-tag validation
  - [ ] Cover matching `v0.1.0` / `0.1.0` cases.
  - [ ] Cover mismatched versions, malformed tags, and prerelease tags.
  - [ ] Run the targeted tests and confirm the red phase.
- [ ] Task: Implement the package/tag version contract
  - [ ] Add a small Node release-check module usable by CI and local commands.
  - [ ] Add `pnpm check:release`.
  - [ ] Validate stable SemVer syntax and exact `v${package.json.version}`
    matching.
  - [ ] Make validation failures return a non-zero exit code with an
    actionable message.
  - [ ] Rerun release-check tests and the full test suite.
- [ ] Task: Expose the package version to the browser build
  - [ ] Enable package JSON version importing under strict TypeScript.
  - [ ] Add a single `APP_VERSION` export derived from `package.json`.
  - [ ] Add a test ensuring the exported version matches package metadata.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2 · Gated Tag Release Pipeline

- [ ] Task: Make existing Pages and container workflows reusable
  - [ ] Preserve current `master` and manual triggers.
  - [ ] Add reusable workflow entry points for release orchestration.
  - [ ] Prevent duplicate standalone tag publication.
  - [ ] Preserve the existing optional Coolify behavior.
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
