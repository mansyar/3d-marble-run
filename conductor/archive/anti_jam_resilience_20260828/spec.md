# Specification: Anti-Jam Resilience — Stuck-Marble Self-Rescue & Funnel Throughput

**Track ID**: `anti_jam_resilience_20260828` · **Type**: Feature (Simulation Reliability) · **Branch**: `feat/anti_jam_resilience_20260828`

## Overview

v0.3.0 streams up to 20 marbles through 7 piece types. Playtesting with continuous streams shows a reliability tail: marbles can **sleep forever inside funnel throats, splitter forks, and tight curve→straight seams** when velocity drops below Rapier's sleep threshold, or pile up behind a slow roller. The existing `findOutOfBoundsMarbleIds` only culls marbles that leave the playable world — it does not rescue *interior* jams. The result is a track that looks "stuck" with 5–6 idle marbles blocking the route, forcing a manual Reset and breaking the zero-instruction promise of "drop and watch."

This track makes runs **self-healing without faking physics**: a pure-logic stuck detector watches live marbles over wall-clock time, applies a single gentle nudge when a marble stalls, and — if it remains stuck — recycles it so the stream stays fluid. In parallel, funnel/splitter contact tuning widens the funnel throat margin and lowers micro-friction that causes the most common jam. No new assets, no new piece types, no music — just reliable flow that respects the product's "juice decorates, never fakes" principle.

Context-aware tight constraint: the payload sits at **3,496.72 kB min / 1,246.57 kB gzip** (headroom 3.28 / 3.43 kB). This track budgets **≤1.8 kB min / ≤1.2 kB gzip** and adds zero runtime media.

## Functional Requirements

### FR-1 · Stuck detection (pure logic, TDD-mandatory)

- A new logic-bearing module `src/sim/stuckDetector.ts` (name may vary) exposes `createStuckDetector(options)` with:
  - `velocityThreshold` (default ~0.12 m/s), `positionEpsilon` (~0.04 m), `stuckWindowMs` (default 1_200 ms), `graceMs` after spawn (default 800 ms — marbles need time to roll).
  - Per-frame input: `update(id, position, velocity, nowMs)` where `nowMs` is elapsed wall-clock (from `stepper`/`performance.now` style clock, not physics step count).
  - Output: `stuckIds(nowMs): number[]` and `isStuck(id): boolean` — deterministic, no Rapier/Three imports.
- Detection rule: a marble is stuck iff for the entire `stuckWindowMs` its speed stays below `velocityThreshold` **and** its displacement stays within `positionEpsilon` of the window's start position. Resets if the marble moves beyond epsilon or regains speed.
- Must handle: spawn burst (no false positives in first `graceMs`), splitter pile-ups (each marble tracked independently), and removal (tracker forgets removed ids). Zero false positives on a marble rolling steadily at 0.5 m/s.

### FR-2 · Self-rescue policy (app integration)

- In `src/app.ts`'s render loop, after `world.step()` and before `detectGoalEntries()`, poll the stuck detector for `stuckIds`.
- Policy per stuck marble, in order:
  1. **First strike — nudge:** apply a single, small, randomized lateral impulse (`±0.25–0.45 m/s` in X/Z, tiny +Y 0.1) via `body.applyImpulse` or `setLinvel` — preserves strictly physical motion, never teleports. Mark as `nudged`.
  2. **Second strike — recycle:** if the same marble is still flagged 900–1_200 ms after the nudge, recycle it via the spawner's `remove(id)` + `removeMarble(id)` path (same as out-of-bounds). No goal credit, no SFX. Silent so kids aren't scolded.
- At most one nudge per marble; at most **3 nudges per second globally** to avoid impulse spam during a 20-marble pile-up.
- The existing `findOutOfBoundsMarbleIds` cleanup remains authoritative and runs alongside this — order: `cleanupStuckMarbles()` → `cleanupOutOfBoundsMarbles()` → `detectGoalEntries()`.

### FR-3 · Funnel & splitter throughput tuning

- **Funnel throat:** increase inner collider clearance by ~6–8% in `src/pieces/builders.ts` (or its trimesh helper) and lower funnel wall friction from current value by ~0.05–0.1, verified not to make marbles unrealistically bouncy. No geometry asset change, no new Three.js dependency.
- **Splitter fork:** ensure both `outlet-l` / `outlet-r` prongs have identical friction/restitution; verify a marble entering `inlet` at 0.8 m/s exits one branch within 600 ms in manual test — no indefinite ridge balance.
- **General:** keep total restitution ≤0.2 on track surfaces so marbles don't ping-pong; preserve current `MARBLE_RADIUS`, `RAMP_RISE`, etc.

### FR-4 · Bounds authority hardening

- Extend `findOutOfBoundsMarbleIds` (or its caller) thresholds to match the stuck-detector's recycling horizon: any marble below `y < -8` (currently implicit) **or** outside a 28×28 XZ playfield for >1 s is culled. Existing tests for out-of-bounds remain green.
- Unified cleanup path: both stuck-recycle and bounds-cull flow through `spawner.remove(id)` so timer/goal state stays consistent.

### FR-5 · Observability (minimal, kid-invisible)

- No HUD change. An optional dev-only console debug (gated behind `import.meta.env.DEV`) may log `[stuck-detector] nudge #id` / `recycle #id` to aid manual verification; never in production.
- If nudges exceed 3 in 5 seconds, still silent — no toast, no guidance pulse (route guidance already pulses unreachable pieces).

## Non-Functional Requirements

- **Payload:** `pnpm check:size` stays ≤3,500 kB min / ≤1,250 kB gzip; delta ≤1.8 kB min / ≤1.2 kB gzip. Zero new runtime dependencies; devDependency-free unless justified in `tech-stack.md` first (workflow rule 2).
- **Performance:** detection is O(n) over live marbles (n≤20), per-frame cost <0.3 ms on a mid-range phone; no allocations per frame beyond a small ring buffer; 20-marble streams remain ≥55 fps on compact DPR 1.5 + 1024 shadows.
- **Physics fidelity:** juice decorates, never fakes — no teleport, no position snap, no velocity clamp except the single nudge impulse; all other motion stays pure Rapier.
- **Testing:** TDD red→green for `stuckDetector.ts` (≥80% coverage, Vitest); round-trip not needed (no serialization). Existing suites for `playability`, `spawner`, `landing`, `goals`, `snapping` stay green. Visual/physics tuning verified via manual protocol per `workflow.md`.
- **Compatibility:** Chrome/Edge/Firefox/Safari desktop · iOS Safari · Android Chrome; IndexedDB saves unaffected (no schema bump — detector is ephemeral).

## Acceptance Criteria

- **AC-1:** With a starter track funnel + 20-marble continuous stream for 60 s on desktop + 393×659 touch, no marble remains motionless inside a piece for >2.5 s — it is nudged once then recycled if still stuck; the visible stream stays fluid and the run timer keeps counting.
- **AC-2:** Unit tests prove: (a) slow-rolling marble (0.5 m/s) is never flagged, (b) marble at 0.05 m/s within 0.03 m for 1_200 ms is flagged, (c) grace period prevents false flag in first 800 ms, (d) removal forgets id, (e) nudge budget caps at 3/s.
- **AC-3:** Funnel jam repro (drop 5 marbles in rapid succession into a lone funnel) clears within 2 s without manual Reset; splitter inlet→outlet traversal completes within 600 ms for a single marble at 0.8 m/s.
- **AC-4:** Existing out-of-bounds marbles are still culled; stuck-recycled marbles do not increment `goalTracker`; `spawner.state().activeIds` stays consistent.
- **AC-5:** `CI=true pnpm vitest run --coverage` ≥80% on the new logic module; `CI=true pnpm biome check .` clean; `pnpm build` + `pnpm check:size` within budget and delta; manual verification on desktop + touch confirms no regression in snap, guidance pulse/glow, Drop point landing, PWA offline, or audio.

## Out of Scope

- New piece types, piece geometry redesign beyond funnel/splitter friction/clearance tweaks, or track Graph changes.
- Teleport-style respawners, marble magnets, or non-physical path-following — only the single impulse nudge is allowed.
- HUD indicators, settings, or player-facing "jam" warnings (product non-goal: no fail-state chrome).
- Sharing/export, challenge modes, marble cosmetics, native packaging, or music/ambient loops (explicit product non-goals).
- Performance profiler UI, per-chunk budgets, or Workbox changes (covered by `pwa_budget` track).
- Save-schema migration — detector state is ephemeral and not persisted.
