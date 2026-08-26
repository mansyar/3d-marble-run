# Specification: Cut v0.2.0 Release

## Overview

Cut Marblescape's next production release (`v0.2.0`) through the established
tagged-release pipeline. No product code changes — this track packages the
~157 commits accumulated since `v0.1.1` (Free Drop Point Spawning, Subtle
Drop Point Guide, Child-First UX/UI Hardening, Unified Edit History &
Undo/Redo) into a validated release.

## Functional Requirements

### FR-1 · Version bump

- Run `pnpm version minor` → `package.json` becomes `0.2.0`; tag `v0.2.0`
  created locally per the documented maintainer workflow.
- Tag must exactly match `v${package.json.version}` (existing validation
  enforces this).

### FR-2 · Pre-tag quality gates (local)

- Frozen install · `CI=true pnpm vitest run --coverage` ·
  `CI=true pnpm biome check .` · TypeScript strict · `pnpm build`.
- Recheck payload budget against ≤3,500 kB JS / ≤1,250 kB gzip (last measured
  3,437.74 / 1,244.96 — tight headroom).

### FR-3 · Manual pre-tag smoke test

Run against the production build via preview.

- **Desktop 1280×720:** place/move/delete pieces, connector snapping,
  Drop point tool + landing guide, mixed-edit undo/redo chronology,
  redo-branch invalidation, save/autosave + named slots reload, goal
  counter/timer, orbit/chase cams.
- **Touch ~393×659:** same core journeys, ≥44px targets, no scroll/errors.

### FR-4 · Tag cut & pipeline monitoring

- Push `v0.2.0` → release workflow: quality gate → GitHub Release (generated
  notes since `v0.1.1`) + Pages deploy + GHCR images (`0.2.0`, `latest`, SHA).
- If any stage fails: fix forward on `master`, then re-cut the tag; never
  force-push over a published tag without an explicit decision.

### FR-5 · Live artifact verification

- Site loads under repository-name base path; About modal shows `v0.2.0`.
- GitHub Release exists with generated notes spanning the four feature tracks.
- GHCR carries all three image tags.

## Non-Functional Requirements

- Zero application-code changes; offline/static runtime model untouched.
- Workflow permissions and deployment policy remain exactly as configured.
- No new logic-bearing modules expected → manual verification per workflow
  exemption.

## Acceptance Criteria

- `package.json` = `0.2.0`, matching pushed tag `v0.2.0`
- All local gates green; bundle within budget
- Smoke test passed on desktop + touch viewports
- Pipeline completed: GitHub Release, Pages, GHCR artifacts live and correct
- README runbook still accurate (update only if a step drifted)

## Out of Scope

- New features, UI changes, CI workflow modifications (unless a defect blocks
  release)
- npm publication, prerelease channels, CHANGELOG files, release-note format
  changes, Coolify policy changes