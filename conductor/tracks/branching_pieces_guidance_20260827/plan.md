# Implementation Plan: Branching Pieces & Route Guidance

## Phase 1 · Splitter Piece (logic + geometry) [checkpoint: abc8fb4]

### [x] Task: Write failing tests for the splitter registry entry `80de0cd`
- Notes: TDD red — 6 failed / 15 passed. Pinned splitter registry contract: exactly 3 run ports (`inlet` at `[0,0,R]` dir `+Z`; `outlet-l/-r` at `[±R,0,0]` dir `±X`), perpendicular dirs, `run|run` reuse, exhaustive type list 5→6.
- Extend registry tests: `splitter` in `PIECE_TYPE_IDS` with exactly 3 ports
  all kind `"run"` (inlet at stem top, two outlets at branch tips); port
  positions/directions consistent with new `SPLITTER_*` dimension constants;
  `canConnect` joins via existing `run|run`. Confirm RED before
  implementation.

### [x] Task: Implement splitter registry entry, geometry & tray `abc8fb4`
- Registry constants + port defs; Y-channel geometry with rounded splitter
  apex in `pieces/builders.ts` + trimesh collider; `PIECE_COLORS` shade
  variant of the curve's hue; `PIECE_LABELS` "Splitter" + tray button
  (compile-time Record exhaustiveness forces both). GREEN.

### [x] Task: Cover changed logic and commit Phase 1 `abc8fb4`
- `pnpm vitest run --coverage` ≥80% on changed registry logic;
  `CI=true pnpm biome check .`; commit `feat(pieces): Add Y-splitter piece`;
  git note attached.
- Notes: registry 100% lines / builders 100% lines (full suite) — coverage,
  Biome, build, and size gate all verified before the single `feat(pieces)`
  commit (implementation + tests combined per red→green flow).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `abc8fb4`
- [x] Run full suite once; propose manual verification (dev server; splitter
  in tray; snaps into routes; yaw rotation works). — 229/229; report attached
  as git note on `abc8fb4`; user confirmed desktop + touch checklist.
- [x] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.

## Phase 2 · Bumper Piece (portless node + free placement) [checkpoint: 6f3d80d]

### [x] Task: Write failing tests for bumper registry & serialization `458847b`
- `"bumper"` type def with empty ports; `TrackDocument` round-trip with
  bumper nodes; old saves without bumpers load; graph BFS treats portless
  nodes safely (never a goal, never in routes). Confirm RED.
- Notes: RED 4/39 — also exposed the serializer's `isPieceTypeId` allow-list
  rejects `"splitter"` (latent Phase 1 gap); fixed in the GREEN commit.

### [x] Task: Implement bumper piece, placement & edit integration `d29c9ce`
- Dome geometry + static dome/sphere collider with high-restitution constant;
  free table placement (surface raycast + ghost preview, touch parity);
  move/delete wired through the unified editor history (tests first for any
  new pure placement logic). GREEN.
- Notes: placement needed zero changes — `classifySnap` already returns
  `free` for zero-candidate (portless) drags. Serializer allow-list fixed for
  both new types (splitter round-trip was silently broken in Phase 1).

### [x] Task: Cover changed logic and commit Phase 2 `d29c9ce`
- Coverage ≥80% on changed logic; commit
  `feat(pieces): Add free-standing bumper piece`; git note attached.
- Notes: full-suite coverage verified with the gate run (registry,
  serialization, builders, tray all exercised); Biome clean; 234/234; payload
  within budget.

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `6f3d80d`
- [x] Run full suite once; propose manual verification (bumper placement on
  the table, bounce feel, move/delete/undo/redo).
- [x] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.
- Notes: verification took three user-feedback rounds — stem rails trimmed
  (`02be177`), smoother arc segments (`10249fe`) + bumper seats on track
  surfaces (`babec33`), smaller dome `0.17/0.16` resolving wedging
  (`6f3d80d`); user confirmed desktop + touch. Report attached as git note
  on `6f3d80d`.

## Phase 3 · Route Guidance (logic + rendering) [checkpoint: 3e0e702]

### [x] Task: Write failing tests for guidance helpers (extend `track/health.ts`) `5ea9560`
- `unreachableConnectorPieces(graph, landingPieceId)`: connector-bearing
  pieces not reachable from the landing piece; portless pieces exempt.
- `routePathsToGoals(graph, landingPieceId)`: ordered piece-id path from the
  landing piece to each reachable goal cup. Confirm RED.

### [x] Task: Implement guidance helpers `331ef0a`
- Extend `src/track/health.ts`; GREEN + ≥80% coverage on changed code.
- Notes: BFS refactor shared via `bfsParents` (parent pointers) +
  `parentsToPath`; new exports `unreachableConnectorPieces` and
  `routePathsToGoals` (`GoalRoute`); dropHealth suite 10/10; import-order +
  optional-chain lint fixed.

### [x] Task: Implement guidance rendering (visual glue) `331ef0a`
- Subtle pulse overlay on unreachable pieces (static tint fallback under
  `prefers-reduced-motion`); soft route glow landing→cup(s); recompute only
  on graph/drop-point edits; auto-hide when not applicable; no new HUD
  controls.
- Notes: new `src/render/guidance.ts` — violet accent (Drop-point hue)
  emissive pulse with reduced-motion static fallback; additive TubeGeometry
  glow rebuilt only on refresh; `tick(elapsedMs)` animates phase only when
  pieces are tracked; refresh hooked into `refreshDropPointHealth`.

### [x] Task: Cover changed logic and commit Phase 3 `331ef0a`
- Commit `feat(guidance): Add unreachable highlights and route glow`; git
  note attached.
- Notes: full gate — Biome clean (107 files), 238/238 tests, build OK,
  payload 3,491.77 kB min / 1,245.14 kB gzip within budget (3,500 / 1,250;
  gzip headroom now ~4.9 kB).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `3e0e702`
- [x] Run full suite once; propose manual verification (disconnect a piece →
  pulse; connect → pulse stops; ready route → glow; bumper never pulses).
- [x] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.
- Notes: three feedback rounds — glow pinned on rails via shared-port bends
  (`51423c4`), riding the ramp incline (`b9b3cf1`), then curving smoothly
  through arcs via registry `channelPath` sampling (RED `4a5a86c`, GREEN
  `3e0e702`); user confirmed desktop + touch. Report attached as git note on
  `3e0e702`.

## Phase 4 · Docs & Release Readiness [checkpoint: 317a03f]

### [x] Task: Update product docs `317a03f`
- `product.md` piece set (5 physical → 7 with splitter + bumper) and
  guidance description; README tray/guidance description.

### [x] Task: Final quality gate `317a03f`
- Full suite, `CI=true pnpm biome check .`, `pnpm build`, `pnpm check:size`
  within ≤3,500 kB min / ≤1,250 kB gzip.
- Notes: Biome clean (107 files), 244/244 tests, build OK, payload
  3,493.19 kB min / 1,245.60 kB gzip within budget (3,500 / 1,250).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `317a03f`
- [x] Full manual protocol on desktop + touch: Y-branch feeds both cups from
  one Drop point; bumper bounce feels physical; pulses/glow behave and exempt
  the bumper; save round-trips.
- [x] Await explicit user confirmation; record final phase checkpoint SHA in
  `plan.md`.
- Notes: user confirmed the full checklist (desktop + touch); report attached
  as git note on `317a03f`.
