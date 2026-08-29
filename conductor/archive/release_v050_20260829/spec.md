# Specification: Cut v0.5.0 Release

## Overview

Cut Marblescape's next production release (`v0.5.0`) through the established
tagged-release pipeline. No product code changes — this track packages the
five merged-but-unreleased tracks accumulated since `v0.4.0` (**Per-Cup Goal
Counters**, **Chase-Cam Immersion Polish**, **Marble Engine Scale-Up — 2×
Population with Adaptive Stream Pacing**, **Toy Visual Polish — Subtle Bevel &
Material Retune**, **Mobile Tray Ergonomics & Free-Placement Touch Polish** —
of which the latter four shipped after v0.4.0's cut, plus **Per-Cup Goal
Counters** merged 2026-08-29) into a validated release.

## Functional Requirements

### FR-1 · Version bump

- Bump `package.json` `0.4.0` → `0.5.0` (minor); tag `v0.5.0` created locally
  on `chore/release-v050` per the documented maintainer workflow, kept
  unpushed until the PR merges and the smoke test passes.
- Tag must exactly match `v${package.json.version}` (existing `check:release`
  validation enforces this).
- `pnpm version` refuses dirty trees: use `pnpm version minor
  --no-git-tag-version` plus a manual bump commit and annotated tag (proven
  v0.3.0/v0.4.0 approach).

### FR-2 · Pre-tag quality gates (local)

- `CI=true pnpm vitest run --coverage` → `CI=true pnpm biome check .` →
  TypeScript strict → `pnpm build` → `pnpm check:size`.
- Payload budget: ≤3,600 kB min / ≤1,260 kB gzip. Reference: v0.4.0 gate
  measured 3,502.35 / 1,248.60; the five post-v0.4.0 tracks add a small JS
  delta (per-cup counters gate measured 3,507.28 / 1,250.16). Treat
  unexplained drift as a blocker to investigate.

### FR-3 · Manual pre-tag smoke test

Run against the production build via preview.

- **Desktop 1280×720 — core suite:** place/move/delete pieces with snapping,
  splitter forking, bumper bounce, Drop point + landing guide, undo/redo,
  autosave + slot reload, goal counter/timer, orbit/chase cams, sound toggle,
  guidance pulses + route glow, PWA install + offline reload.
- **Desktop — v0.5.0 track regression checks:**
  - *Chase-cam immersion:* eased fly-in on View toggle; tap-a-marble-to-ride
    in free mode; seamless handoff when the followed marble despawns.
  - *Per-cup goal counters:* each cup shows its own floating tally; splitter
    branches tally independently; chips follow move/delete/undo/redo; reset
    and save load zero chips; reduced-motion increments are instant.
  - *Engine scale-up:* 40/60 caps, stream self-pacing, pooled redeploy.
- **Touch ~393×659:** same core journeys; ≥44px targets; chips don't block
  building; no page scroll or console errors.

### FR-4 · Tag cut & pipeline monitoring

- Push `chore/release-v050`, open a PR to `master` with CI green, merge with
  a merge commit (so the tagged bump commit stays in master ancestry), then
  push tag `v0.5.0` → release workflow: quality gate → GitHub Release
  (auto-generated notes spanning `v0.4.0…v0.5.0`) + Pages deploy + GHCR
  images (`0.5.0`, `latest`, SHA).
- If any stage fails: fix forward, then re-cut the tag; never force-push
  over a published tag without an explicit decision.

### FR-5 · Live artifact verification

- Site loads under repository-name base path; About modal shows `v0.5.0`.
- GitHub Release exists with generated notes spanning the released tracks.
- GHCR carries all three image tags.
- README runbook re-checked against the actual flow (update only if a step
  drifted).

## Non-Functional Requirements

- Zero application-code changes; offline/static runtime model untouched.
- Workflow permissions and deployment policy remain exactly as configured.
- No new logic-bearing modules → manual verification per workflow exemption.

## Acceptance Criteria

- `package.json` = `0.5.0`, matching pushed tag `v0.5.0`
- All local gates green; bundle within the ≤3,600 / ≤1,260 budget
- Smoke test passed on desktop + touch viewports (core suite + track
  regression checks)
- Pipeline completed: GitHub Release, Pages, GHCR artifacts live and correct
- README runbook still accurate (update only if a step drifted)

## Out of Scope

- New features, UI changes, CI workflow modifications (unless a defect
  blocks release)
- npm publication, prerelease channels, CHANGELOG files, release-note format
  changes, Coolify policy changes
