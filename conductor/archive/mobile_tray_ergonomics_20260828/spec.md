# Specification: Mobile Tray Ergonomics & Free-Placement Touch Polish

## Overview

v0.3.0 shipped 7 physical pieces + Drop point = 8 tray buttons. On narrow phones (320–393 px) the Child-First tray now overflows — buttons wrap or shrink below 44 px, play area is squeezed, and the new Splitter/Bumper are hard to reach. Meanwhile the free-placed Bumper and Drop point share the same surface raycast hit-test as the table, with no extra finger slop, and the ghost preview lacks touch contrast.

This track restores ergonomic parity with a **CSS-only horizontal scroll tray** (single row, native momentum, snap + fade + separator) plus **free-placement touch polish** (enlarged hit-radius and ghost boost) and **keyboard scroll centering**. It keeps the warm-wood toy aesthetic, ≤6 hues, and the existing payload budget — no libraries, no new assets, ≤2 kB delta.

## Functional Requirements

### FR-1 · Horizontal scroll tray (320–393 px → 1280 px)

- Tray remains a single row at every width; on ≥768 px all 8 buttons fit without scroll, on <768 px overflow becomes `overflow-x: auto` with momentum (`-webkit-overflow-scrolling: touch`).
- Every button keeps ≥44 px touch target (existing `tray-btn` size untouched); gaps 8 px, tray height ~72 px, no vertical growth.
- Native scroll only — `scroll-snap-type: x mandatory` on tray, `scroll-snap-align: center` on buttons; scrollbar hidden (thin/auto) but still scrollable by touch/mouse wheel/trackpad.
- Buttons are not reordered; registry order preserved (straight · curve · ramp · funnel · splitter · bumper · goal-cup · Drop point) so muscle memory stays.

### FR-2 · Scroll affordance & Drop-point separation

- Drop point stays visually distinct: violet `#8338ec` accent retained, preceded by a 12 px gap + 1 px vertical divider (`opacity 0.12`) separating track pieces from the entry tool.
- Edge fade masks 20–24 px left/right using CSS `mask-image` / gradient overlays; left fade hidden at `scrollLeft == 0`, right fade hidden at max scroll (JS toggles two `at-start`/`at-end` classes, or pure CSS if feasible).
- Active button is auto-centered via `scrollIntoView({ inline: "center", behavior: "smooth" })` on selection; touch scroll position is preserved across selections.

### FR-3 · Free-placement touch polish

- **Hit-radius slop:** Bumpers and Drop point surface raycasts gain 12–16 px effective slop on `pointerType === "touch"` (or `maxTouchPoints > 0`). Convert CSS px slop to NDC/world at current camera distance; apply only to the free-placement raycaster, not connector-snapping ports.
- **Ghost boost on touch:** When dragging on touch, the translucent ghost preview raises to `opacity 0.95`, adds a 2 px high-contrast outline (`#fff` at 0.9 with `drop-shadow`), and stays aligned to the touch point (centered under finger with 16 px upward offset so finger doesn't hide it).
- Mouse behavior unchanged on desktop; miss tolerance stays tight for precision.

### FR-4 · Keyboard & reduced-motion

- ArrowLeft / ArrowRight scroll tray by one button width; Home/End jump to start/end. Focus moves with selection; `tabIndex` managed so tray is a single tab stop + roving focus.
- `prefers-reduced-motion: reduce` disables smooth scroll (`behavior: "auto"`), fades, and pulse; no motion sickness.
- Keyboard parity works with tray hidden scrollbars (keyboard still scrolls container).

### FR-5 · Visual system

- No new hue family: reuse existing piece colors + violet Drop point; ≤6 saturated hues maintained; shape still differentiates pieces.
- Typography, shadows, rounded friendly sans-serif unchanged; minimal HUD principle kept — no new chrome, no labels-forced on mobile beyond existing `tray-label`.
- Copy unchanged (kid-safe labels "Splitter", "Bumper", "Drop point").

## Non-Functional Requirements

- **Mobile parity:** Touch placement for Bumper/Drop point, guidance pulses still legible, DPR/shadow caps untouched.
- **Payload:** `pnpm check:size` stays within ≤3,500 kB min / ≤1,250 kB gzip; this track budgets **≤2 kB min / ≤1 kB gzip delta**; still zero external runtime assets (manifest + SW excluded per pwa_budget track).
- **Performance:** Native scroll at 60 fps; no layout thrash on scroll; `scroll` listeners passive, class toggles throttled via `requestAnimationFrame`; 20-marble streams remain smooth.
- **Compatibility:** Chrome/Edge/Firefox/Safari desktop · iOS Safari · Android Chrome; existing tests keep passing; Biome + strict TypeScript stay clean.
- **Testing:** Visual glue verified via manual verification protocol per `workflow.md`; any new pure logic helper (hit-radius conversion, scroll-state helper) gets Vitest TDD with ≥80% coverage.

## Acceptance Criteria

- On 393×659 touch viewport, all 8 tray buttons are ≥44 px, single row, horizontally scrollable with momentum and snap; no wrap, no shrink.
- Left fade hidden at start, right fade hidden at end; divider before Drop point visible; selecting a button centers it (smooth unless reduced-motion).
- On touch, Bumper/Drop point placement feels roomier — taps 12–16 px off the surface still hit; ghost preview has boosted contrast/outline and doesn't hide under finger.
- Arrow keys scroll tray; disabled motions obey `prefers-reduced-motion`.
- Old saves load; `pnpm check:size` within budget (delta ≤2 kB); CI green: vitest, biome, build.
- Docs updated: README tray paragraph notes horizontal scroll.

## Out of Scope

- New piece types, tray pagination/overflow menu, collapsible groups, marble routing changes.
- Haptics / vibration, haptic feedback libs, new audio, new settings UI.
- Sharing/export, challenge modes, marble cosmetics (product non-goals).
- Save schema version bump; risk: icon generation changes.
- JS carousel/slider libraries (Splide, Swiper, etc.) — native scroll only.

