# Implementation Plan: Branching Pieces & Route Guidance

## Phase 1 · Splitter Piece (logic + geometry)

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

### [ ] Task: Cover changed logic and commit Phase 1
- `pnpm vitest run --coverage` ≥80% on changed registry logic;
  `CI=true pnpm biome check .`; commit `feat(pieces): Add Y-splitter piece`;
  git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; propose manual verification (dev server; splitter
  in tray; snaps into routes; yaw rotation works).
- [ ] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.

## Phase 2 · Bumper Piece (portless node + free placement)

### [ ] Task: Write failing tests for bumper registry & serialization
- `"bumper"` type def with empty ports; `TrackDocument` round-trip with
  bumper nodes; old saves without bumpers load; graph BFS treats portless
  nodes safely (never a goal, never in routes). Confirm RED.

### [ ] Task: Implement bumper piece, placement & edit integration
- Dome geometry + static dome/sphere collider with high-restitution constant;
  free table placement (surface raycast + ghost preview, touch parity);
  move/delete wired through the unified editor history (tests first for any
  new pure placement logic). GREEN.

### [ ] Task: Cover changed logic and commit Phase 2
- Coverage ≥80% on changed logic; commit
  `feat(pieces): Add free-standing bumper piece`; git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; propose manual verification (bumper placement on
  the table, bounce feel, move/delete/undo/redo).
- [ ] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.

## Phase 3 · Route Guidance (logic + rendering)

### [ ] Task: Write failing tests for guidance helpers (extend `track/health.ts`)
- `unreachableConnectorPieces(graph, landingPieceId)`: connector-bearing
  pieces not reachable from the landing piece; portless pieces exempt.
- `routePathsToGoals(graph, landingPieceId)`: ordered piece-id path from the
  landing piece to each reachable goal cup. Confirm RED.

### [ ] Task: Implement guidance helpers
- Extend `src/track/health.ts`; GREEN + ≥80% coverage on changed code.

### [ ] Task: Implement guidance rendering (visual glue)
- Subtle pulse overlay on unreachable pieces (static tint fallback under
  `prefers-reduced-motion`); soft route glow landing→cup(s); recompute only
  on graph/drop-point edits; auto-hide when not applicable; no new HUD
  controls.

### [ ] Task: Cover changed logic and commit Phase 3
- Commit `feat(guidance): Add unreachable highlights and route glow`; git
  note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Run full suite once; propose manual verification (disconnect a piece →
  pulse; connect → pulse stops; ready route → glow; bumper never pulses).
- [ ] Await explicit user confirmation; record phase checkpoint SHA in
  `plan.md`.

## Phase 4 · Docs & Release Readiness

### [ ] Task: Update product docs
- `product.md` piece set (5 physical → 7 with splitter + bumper) and
  guidance description; README tray/guidance description.

### [ ] Task: Final quality gate
- Full suite, `CI=true pnpm biome check .`, `pnpm build`, `pnpm check:size`
  within ≤3,500 kB min / ≤1,250 kB gzip.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
- [ ] Full manual protocol on desktop + touch: Y-branch feeds both cups from
  one Drop point; bumper bounce feels physical; pulses/glow behave and exempt
  the bumper; save round-trips.
- [ ] Await explicit user confirmation; record final phase checkpoint SHA in
  `plan.md`.
