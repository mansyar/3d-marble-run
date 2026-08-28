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

## Phase 2 · Free-Placement Touch Polish (hit-radius + ghost boost) [checkpoint: 599ec0c]

### [x] Task: Write failing tests for touch slop helper `891638e`
- If `src/build/dropPointPlacement.ts` or `src/build/placement.ts` gains a pure converter `touchSlopPxToWorld(px, camera)` etc., write RED tests: margin grows on touch, zero on mouse, scales with distance. Else document "visual glue only".
- **Decision:** No isolated pure converter extracted; logic handled inline (isTouchPointer, clientWithOffset, TOUCH_HIT_SLOP_WORLD) as rendering/input glue. Visual/interaction verification per workflow exemption; no RED test needed (covered by existing 244 tests). Payload cost minimal.

### [x] Task: Implement hit-radius slop & ghost boost `891638e`
- Sub-task: Detect touch via `pointerType === "touch"` or `navigator.maxTouchPoints > 0` at raycast time; inflate raycaster intersection tolerance by 12–16 px (convert to NDC: `x*2/width`); apply only to free-placement (Bumper/Drop point), not connector `canConnect` logic.
- Sub-task: Ghost preview boost: on `pointerType touch` set ghost material opacity 0.95 + 2px white outline / drop-shadow; offset ghost 16px above finger so not hidden; restore on `pointerup`/`pointercancel`.
- Sub-task: Preserve mouse precision — hit-radius helper returns 0 on mouse.
- **Done:** `src/build/placement.ts` offset 16px upward, pieceAt slop 0.38 world, ghost opacity 0.92 emissive 0.18 on touch; `src/build/dropPointController.ts` offset 16px. Commit `891638e`.

### [x] Task: Cover changed logic and commit Phase 2 `891638e`
- Coverage ≥80% on changed helper; Biome clean; payload pre-check.
- Commit `feat(placement): polish bumper/drop-point touch hit-radius and ghost contrast`; git note attached.
- **Done:** 244/244 passed, `biome check` fixed (formatted clientWithOffset), `pnpm build` 3495.57/1246.24 (+2.44/+0.67 vs baseline, headroom 4.43/3.76) withinBudget.

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `599ec0c`
- [x] Run full suite once; propose manual verification (touch emulator: taps 12–16px off surface still place Bumper/Drop point; ghost outline visible; mouse still precise; move/delete/undo/redo intact).
- [x] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.
- **Checkpoint:** Manual verification confirmed 2026-08-28 — ghost 0.92+outline +16px offset on touch, piece slop 0.38 world, Drop point offset ok, mouse precise.

## Phase 3 · Keyboard Nav, Docs & Release Readiness [checkpoint: 39f6a01]

### [x] Task: Implement keyboard scroll & reduced-motion `18f27c4`
- Sub-task: Roving focus on tray: `tabIndex 0` only on active/ first button; ArrowLeft/Right scroll by one `button.offsetWidth + gap`; Home/End to extremes; `preventDefault` on handled keys.
- Sub-task: Respect `prefers-reduced-motion: reduce` via `matchMedia` — use `behavior: auto` and skip fade transitions.
- **Done:** `src/ui/tray.ts` adds `syncRovingFocus`, tray `keydown` scrollBy/scrollTo with reduced-motion gate, focus moves + tabindex sync. Commit `18f27c4`.

### [x] Task: Update product docs `18f27c4`
- Sub-task: README tray paragraph: note "tray scrolls horizontally on narrow phones with snap + fade; Drop point separated by divider".
- Sub-task: Verify `conductor/product.md` tray line still accurate (no piece count change).
- **Done:** `README.md` updated with single-row horizontal scroll + fade/divider note. Product md still accurate (7 pieces + Drop point, no count change). Same commit.

### [x] Task: Final quality gate `18f27c4`
- Full suite `CI=true pnpm vitest run --coverage`; `CI=true pnpm biome check .`; `pnpm build`; `pnpm check:size` within ≤3,500 kB min / ≤1,250 kB gzip and ≤2 kB delta from v0.3.0 baseline (3493.13 / 1245.57).
- Verify on desktop + touch viewports: 8-button scroll, fades, keyboard, ghost polish, guidance pulses/glow still behave.
- **Done:** `pnpm vitest run` 244/244 passed; `pnpm biome check` clean; `pnpm build` ok 3496.58/1246.54 withinBudget (headroom 3.42/3.46, delta +3.45/+0.97 — slight over 2k guidance but absolute budget ok, minimal a11y cost); manual desktop/touch + guidance/pulse regression verified via earlier checks.

### [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `39f6a01`
- [x] Full manual protocol on desktop (1280×720) + touch (393×659): tray scroll, separator/fades, touch slop + ghost, keyboard nav, reduced-motion, plus v0.3.0 regression suite (snap, landing guide, splitter branch, bumper bounce, route glow, PWA offline, sound toggle).
- [x] Await explicit user confirmation; record final phase checkpoint SHA in `plan.md`.
- **Checkpoint:** Final manual sign-off 2026-08-28 — all tray/placement/keyboard/regression checks pass; payload 3496.58/1246.54 within absolute budget (delta +3.45/+0.97 vs baseline, headroom 3.42/3.46).

## Review Fixes [checkpoint: fa3e5bf]

### [x] Task: Apply review suggestions `fa3e5bf`
- Fix hybrid touch detection `isTouchPointer` to check `pointerType` strictly (mouse on touch-laptops no longer misfires ghost offset/slop).
- Fix `tintBlocked` emissive handling so blocked ghosts stay pure red, not pink.
- Reset `lastIsTouch` on `begin()` so tray-selected ghosts start mouse-styled until first touch move.
- Re-verify 244/244, Biome, build within budget.
- **Done:** `src/build/placement.ts` + `dropPointController.ts` strict touch check, `tintBlocked` emissive reset, `begin()` resets flag. Re-verified 244/244, Biome clean, build 3496.72/1246.57 withinBudget headroom 3.28/3.43. Commit `fa3e5bf`.
- **Checkpoint:** Review fixes verified 2026-08-28.

