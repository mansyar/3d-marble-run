# Specification: Cut v0.4.0 Release

## Overview

Cut Marblescape's next production release (`v0.4.0`) through the established
tagged-release pipeline. No product code changes — this track packages the
four merged-but-unreleased tracks accumulated since `v0.3.0` (**Mobile Tray
Ergonomics & Free-Placement Touch Polish**, **Anti-Jam Resilience —
Stuck-Marble Self-Rescue & Funnel Throughput**, **Toy Visual Polish — Subtle
Bevel & Material Retune**, **Marble Engine Scale-Up — 2× Population with
Adaptive Stream Pacing**) into a validated release.

## Functional Requirements

### FR-1 · Version bump

- Bump `package.json` `0.3.0` → `0.4.0` (minor); tag `v0.4.0` created locally
  on `chore/release-v040` per the documented maintainer workflow, kept
  unpushed until the PR merges and the smoke test passes.
- Tag must exactly match `v${package.json.version}` (existing `check:release`
  validation enforces this).
- Note: `pnpm version <cmd>` refuses dirty trees — v0.3.0 used
  `pnpm version minor --no-git-tag-version` plus a manual bump commit and an
  annotated tag; this plan follows the same proven approach.

### FR-2 · Pre-tag quality gates (local)

- Frozen install · `CI=true pnpm vitest run --coverage` ·
  `CI=true pnpm biome check .` · TypeScript strict · `pnpm build` ·
  `pnpm check:size`.
- Payload budget: ≤3,600 kB min / ≤1,260 kB gzip (re-baselined 2026-08-28 in
  `marble_engine_scaleup_20260828`; that gate measured 3,502.35 / 1,248.60 —
  headroom 97.65 / 11.40 kB). Treat unexplained drift as a blocker to
  investigate, not to hand-wave.

### FR-3 · Manual pre-tag smoke test

Run against the production build via preview.

- **Desktop 1280×720 — v0.3.0 core suite:** place/move/delete pieces with
  connector snapping, splitter forking both branches, bumper placement +
  physical bounce, Drop point tool + landing guide, mixed-edit undo/redo
  chronology and redo-branch invalidation, autosave + named slot reload,
  goal counter/timer, orbit/chase cams, sound toggle + procedural SFX,
  unreachable pulses + drop→cup route glow, PWA install + offline reload.
- **Desktop — v0.4.0 track regression checks:**
  - *Mobile tray ergonomics:* narrow-viewport tray stays a single row that
    scrolls horizontally with momentum, snap points, edge fades, and the
    divider before the Drop point; ≥44px targets; desktop tray fits without
    scrolling.
  - *Anti-jam resilience:* marbles wedged in tight geometry self-nudge, then
    recycle without goal credit; funnel throughput keeps flowing under a
    sustained stream.
  - *Toy visual polish:* subtle bevels and retuned materials render on all
    seven piece types; bright/soft lighting unchanged.
  - *Engine scale-up:* marble cap 40 on Auto phone-tier / 60 on High or
    desktop; continuous stream self-paces under sustained frame drops while
    manual drops stay responsive; recycled marbles redeploy cleanly.
- **Touch ~393×659:** same core journeys plus tray ergonomics; ≥44px
  targets; no page scroll or console errors.

### FR-4 · Tag cut & pipeline monitoring

- Push `chore/release-v040`, open a PR to `master` with CI green, merge with
  a merge commit (so the tagged bump commit stays in master ancestry), then
  push tag `v0.4.0` → release workflow: quality gate → GitHub Release
  (auto-generated notes spanning `v0.3.0…v0.4.0`) + Pages deploy + GHCR
  images (`0.4.0`, `latest`, SHA) + optional Coolify redeploy.
- If any stage fails: fix forward, then re-cut the tag; never force-push
  over a published tag without an explicit decision.

### FR-5 · Live artifact verification

- Site loads under repository-name base path; About modal shows `v0.4.0`.
- GitHub Release exists with generated notes spanning the four released
  tracks.
- GHCR carries all three image tags.
- README runbook re-checked against the actual flow (update only if a step
  drifted).

## Non-Functional Requirements

- Zero application-code changes; offline/static runtime model untouched.
- Workflow permissions and deployment policy remain exactly as configured.
- No new logic-bearing modules expected → manual verification per workflow
  exemption.

## Acceptance Criteria

- `package.json` = `0.4.0`, matching pushed tag `v0.4.0`
- All local gates green; bundle within the ≤3,600 / ≤1,260 budget
- Smoke test passed on desktop + touch viewports (v0.3.0 suite + four-track
  regression checks)
- Pipeline completed: GitHub Release, Pages, GHCR artifacts live and correct
- README runbook still accurate (update only if a step drifted)

## Out of Scope

- New features, UI changes, CI workflow modifications (unless a defect
  blocks release)
- npm publication, prerelease channels, CHANGELOG files, release-note format
  changes, Coolify policy changes
