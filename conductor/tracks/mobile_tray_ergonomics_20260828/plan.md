# Implementation Plan: Mobile Tray Ergonomics & Free-Placement Touch Polish

## Phase 1 · Tray Horizontal Scroll & Affordance [checkpoint: b16b538]

### [x] Task: Write failing tests for tray scroll helper (if logic-bearing) `bd0018c`
- If a pure helper `trayScroll.ts` or scroll-state util is introduced, pin behavior: `atStart(scrollLeft)`, `atEnd(scrollLeft, scrollWidth, clientWidth)`, keyboard step size, reduced-motion branch. Confirm RED before implementation.
- If implementation stays purely CSS/DOM glue, skip with note: "visual glue — verified manually per workflow.md exemption".
- **Decision:** Visual glue only — tray scroll is CSS + DOM scroll listeners; no pure logic helper extracted this phase. Verified manually per workflow.md §Test Logic, Verify Visuals. No RED test needed.

### [x] Task: Implement CSS tray horizontal scroll `bd0018c`
- Sub-task: Set `#hud-tray` to `display:flex; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; gap:8px; scrollbar-width:none` plus `::-webkit-scrollbar { display:none }`.
- Sub-task: Buttons `scroll-snap-align:center; flex:0 0 auto; min-width:44px; min-height:44px` preserved; ensure tray height stays ~72px, no wrap on 320 px.
- Sub-task: On ≥768 px ensure tray fits without overflow (still scrollable-safe, but no scroll needed); verify on desktop 1280×720 no scrollbar artifact.
- **Done:** `src/style.css` updated with nowrap scroll, snap, hidden scrollbar, max-width; `src/ui/tray.ts` separator + scroll state. Commit `bd0018c`.

### [x] Task: Implement scroll affordance & Drop-point separator `bd0018c`
- Sub-task: Insert 12px spacer + 1px vertical divider before Drop point (CSS `::before` or extra div with `opacity:0.12`); keep violet accent on Drop point.
- Sub-task: Add left/right fade masks (20–24px gradient overlays or `mask-image` linear-gradient); toggle `at-start`/`at-end` classes from a passive `scroll` listener throttled via `requestAnimationFrame`.
- Sub-task: Auto-center active button: `button.scrollIntoView({ behavior: reducedMotion? 'auto':'smooth', inline:'center', block:'nearest' })` on `setActive()`.
- **Done:** Mask-image fades (24px), `.tray-separator` vertical divider, rAF scroll listener, auto-center active in `setActive()`. Same commit `bd0018c`.

### [x] Task: Cover changed logic and commit Phase 1 `bd0018c`
- `pnpm vitest run --coverage` ≥80% on any changed logic helper; `CI=true pnpm biome check .`; verify `pnpm build` ok.
- Commit `feat(tray): make tray horizontally scrollable with fade and separator`; git note attached.
- **Done:** `pnpm vitest run` 244/244 passed; `pnpm biome check` clean (after fixing unused var); `pnpm build` ok 3494.87/1246.03 within budget (+1.74/+0.46 vs 3493.13/1245.57).

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `b16b538`
- [x] Run full suite once; propose manual verification (dev server; 393×659 touch: scroll with finger, snap points, fades hide at edges, divider visible, active centers, 1280 desktop unchanged).
- [x] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.
- **Checkpoint:** Manual verification confirmed 2026-08-28 — fades hide at edges, snap works, auto-center ok, divider visible, headroom 5.13kB/3.97kB.

## Phase 2 · Free-Placement Touch Polish (hit-radius + ghost boost) [checkpoint: TBD]

### [ ] Task: Write failing tests for touch slop helper `TBD`
- If `src/build/dropPointPlacement.ts` or `src/build/placement.ts` gains a pure converter `touchSlopPxToWorld(px, camera)` etc., write RED tests: margin grows on touch, zero on mouse, scales with distance. Else document "visual glue only".

### [ ] Task: Implement hit-radius slop & ghost boost `TBD`
- Sub-task: Detect touch via `pointerType === "touch"` or `navigator.maxTouchPoints > 0` at raycast time; inflate raycaster intersection tolerance by 12–16 px (convert to NDC: `x*2/width`); apply only to free-placement (Bumper/Drop point), not connector `canConnect` logic.
- Sub-task: Ghost preview boost: on `pointerType touch` set ghost material opacity 0.95 + 2px white outline / drop-shadow; offset ghost 16px above finger so not hidden; restore on `pointerup`/`pointercancel`.
- Sub-task: Preserve mouse precision — hit-radius helper returns 0 on mouse.

### [ ] Task: Cover changed logic and commit Phase 2 `TBD`
- Coverage ≥80% on changed helper; Biome clean; payload pre-check.
- Commit `feat(placement): polish bumper/drop-point touch hit-radius and ghost contrast`; git note attached.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md) `TBD`
- [ ] Run full suite once; propose manual verification (touch emulator: taps 12–16px off surface still place Bumper/Drop point; ghost outline visible; mouse still precise; move/delete/undo/redo intact).
- [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 3 · Keyboard Nav, Docs & Release Readiness [checkpoint: TBD]

### [ ] Task: Implement keyboard scroll & reduced-motion `TBD`
- Sub-task: Roving focus on tray: `tabIndex 0` only on active/ first button; ArrowLeft/Right scroll by one `button.offsetWidth + gap`; Home/End to extremes; `preventDefault` on handled keys.
- Sub-task: Respect `prefers-reduced-motion: reduce` via `matchMedia` — use `behavior: auto` and skip fade transitions.

### [ ] Task: Update product docs `TBD`
- Sub-task: README tray paragraph: note "tray scrolls horizontally on narrow phones with snap + fade; Drop point separated by divider".
- Sub-task: Verify `conductor/product.md` tray line still accurate (no piece count change).

### [ ] Task: Final quality gate `TBD`
- Full suite `CI=true pnpm vitest run --coverage`; `CI=true pnpm biome check .`; `pnpm build`; `pnpm check:size` within ≤3,500 kB min / ≤1,250 kB gzip and ≤2 kB delta from v0.3.0 baseline (3493.13 / 1245.57).
- Verify on desktop + touch viewports: 8-button scroll, fades, keyboard, ghost polish, guidance pulses/glow still behave.

### [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md) `TBD`
- [ ] Full manual protocol on desktop (1280×720) + touch (393×659): tray scroll, separator/fades, touch slop + ghost, keyboard nav, reduced-motion, plus v0.3.0 regression suite (snap, landing guide, splitter branch, bumper bounce, route glow, PWA offline, sound toggle).
- [ ] Await explicit user confirmation; record final phase checkpoint SHA in `plan.md`.

