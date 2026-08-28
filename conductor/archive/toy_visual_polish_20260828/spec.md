# Specification: Toy Visual Polish — Subtle Bevel & Material Retune

**Track ID**: `toy_visual_polish_20260828` · **Type**: Feature (Visual Polish) · **Branch**: `feat/toy_visual_polish_20260828`

## Overview

v0.3.0 shipped 7 physical pieces + Drop point at **3,493.13 kB min / 1,245.57 kB gzip** (headroom 6.87 / 4.43 kB at tag) and has since absorbed Mobile Tray Ergonomics + Anti-Jam Resilience, leaving headroom near **1.5 / 2.7 kB** — essentially a locked budget. The toy identity still feels sharp-edged: piece extrusions have hard 90° rails, MeshStandard roughness is uniformly flat, the table is a dead-flat tan plane (roughness 0.9), and route guidance (violet pulse + glow) washes out on compact DPR 1.5 / 1024-shadow phones. Lighting is bright but the plastic gloss reads weak (RoomEnvironment at 0.04).

This track makes Marblescape *feel* like a physical toy set without adding assets or hue families: a **subtle 0.02–0.04 edge bevel** on rails, a **material retune** per piece family for candy-glass gloss, a **softened table/light pass** (warm tint + env boost + softer shadows), and a **compact-only guidance legibility boost**. A minimal **Auto/High quality preference** (persisted, one icon button — the only setting beyond reset allowed by product.md) caps DPR/shadows on low-battery/low-memory phones so the extra gloss never costs fluid 20-marble runs. All changes stay within **≤2.0 kB min / ≤1.2 kB gzip** delta and the zero-runtime-asset rule (PWA shell chrome excluded per pwa_budget).

Context-aware choices from the interactive spec (subtle bevel + retune · table retune without grain · compact guidance boost · Auto+toggle) drive every FR below.

## Functional Requirements

### FR-1 · Piece Bevel & Candy-Glass Material Retune

- **Bevel:** Add a light chamfer (0.02–0.04 world units) to straight / curve / ramp / splitter rail edges and funnel outer rim via `src/pieces/builders.ts` + trimesh helper. Keep segment counts unchanged; no new buffers beyond the chamfer inset. Bumper dome and goal-cup lip stay unchamfered (already rounded). Visual change must be obvious on desktop but not inflate geometry >0.6 kB min.
- **Materials:** Retune `src/pieces/materials.ts` per family — lower `roughness` 0.35→0.28 for saturated plastic, keep `metalness` ≤0.05, bump `envMapIntensity` 1.0→1.2 for stronger RoomEnvironment gloss, preserve bold primary palette. ≤6 saturated hues on screen maintained; shape still differentiates — never rely on hue alone. Drop-point violet `#8338ec` unchanged.
- **Tracer:** Tray `PIECE_COLORS` shade-family reuse untouched; no new hue family; warm wood neutrals still carry the scene.
- **Acceptance:** Side-by-side before/after on 1280×720 shows softer edge highlights on rails and visibly glossier plastic under the hemispheric env without color shift.

### FR-2 · Table & Lighting Retune (warm wood + soft studio light)

- **Table:** Keep single `PlaneGeometry(60,60)` at `y=0` but retune `MeshStandardMaterial`: warm wood tint stays `#c79a63` ±3% (tan family), `roughness` 0.9→0.85 for a faint satin, no procedural grain/bump, no new canvas or shader noise. Still procedural — zero asset.
- **Lighting:** Bright, soft, even per `product-guidelines.md`. Hemisphere `0.9→0.95` (hemisphere/ground `#d8c3a5`), Directional sun `1.6` intensity stays, position `8,14,6` stays, but set `sun.shadow.radius = 2` for PCFSoft softness. Keep shadow map sizes capped per `product.md` (compact 1024, desktop 2048) — no increase. Optionally lift `PMREMGenerator` env capture from `0.04→0.06` so plastic gloss pops; dispose handling unchanged.
- **Acceptance:** Playroom table reads slightly warmer/satin vs current flat matte; shadows have softer penumbra; marbles catch a gentle specular without dark corners or murk.

### FR-3 · Guidance Compact Legibility Boost

- **Unreachable pulse:** In `src/render/guidance.ts`, when `compactViewport` (≤768px or `maxTouchPoints>0`) increase violet pulse `emissiveIntensity` +20% (e.g., 0.18→0.22) and keep static-tint fallback under `prefers-reduced-motion: reduce`. Portless bumpers and Drop point remain exempt — never pulse.
- **Route glow:** When `assessDropPointHealth` is `ready`, glow `TubeGeometry` radius +20% on compact only (e.g., `0.04→0.048`), additive blending unchanged. Recompute only on graph / drop-point edits, not per frame; auto-hides when route breaks; supports multi-goal.
- **Rendering glue:** No new HUD controls; no new port kinds; discovery via `unreachableConnectorPieces` / `routePathsToGoals` in `src/track/health.ts` already.
- **Acceptance:** On 393×659 touch, disconnected connector piece pulse is effortlessly visible; drop→cup glow traces cleanly center-rail (not floating), still respects reduced-motion.

### FR-4 · Quality Preference & Auto Toggle (essential setting)

- **New logic-bearing module** `src/core/quality.ts` (or `src/render/qualityPreference.ts` — name may vary) exposing:
  ```ts
  type QualityMode = "auto" | "high";
  getQualityMode(): QualityMode  // reads localStorage "marblescape:quality", defaults "auto"
  setQualityMode(m: QualityMode): void
  resolveQuality(opts:{compact:boolean, deviceMemory?:number, battery?:{level:number, charging:boolean}}, mode:QualityMode): {dprCap:number, shadowSize:number}
  ```
  Pure logic, no Three/Rapier/DOM imports except `localStorage` accessor injectable for tests. TDD-mandatory, ≥80% coverage.
- **Auto policy:** `auto` caps to compact values (DPR 1.5, 1024 shadows) when `compact===true` OR `deviceMemory≤4` OR `battery.level<0.2 && !battery.charging`; otherwise allows desktop values (DPR 2, 2048). `high` forces desktop values even on compact. Uses `navigator.deviceMemory` and `navigator.getBattery?.()` when available; silently falls back if absent. No allocations per frame.
- **Boot integration:** `src/render/scene.ts` `initScene` reads resolved quality *before* `WebGLRenderer` creation to set `antialias = !cappedCompact`, `dprCap`, `shadow.mapSize`. Changing the toggle hot-updates `renderer.setPixelRatio` and `sun.shadow.mapSize` without reload; if toggle switches to `auto` on a low-battery phone, DPR/shadow drop smoothly.
- **UI:** Single icon button next to `soundToggle` in `#top-hud` (reuse `top-hud` pattern), `≥44px`, `aria-label` "Quality: Auto/High", `aria-pressed`, persisted, kid-safe copy sentence-case. One button only — no settings panel, no new chrome beyond the allowed quality toggle. `prefers-reduced-motion` does not affect the toggle.
- **Acceptance:** On desktop, toggle is Auto by default and reads High after one tap and persists across reloads; on emulated 393×659 or forced low-memory/battery stubs, Auto correctly caps. No visual regression in non-quality paths.

## Non-Functional Requirements

- **Payload:** `pnpm check:size` stays ≤3,500 kB min / ≤1,250 kB gzip globally; this track deltas **≤2.0 kB min / ≤1.2 kB gzip** (target +1.0/+0.6). Zero new runtime dependencies; zero external media assets (PWA manifest/service-worker + generated icons excluded per pwa_budget). Measured on `pnpm build` at each phase close.
- **Performance:** Init overhead <5 ms; bevel adds no per-frame cost; guidance still recomputes only on edits; 20-marble continuous streams remain ≥55 fps on compact DPR 1.5 + 1024 shadows (mid-range phone). No layout thrash, no per-frame allocations.
- **Visual identity:** Follows `product-guidelines.md` — bold primaries on warm wood, ≤6 saturated hues, rounded friendly sans-serif, bright/soft/even lighting, bouncy placement snaps unchanged, juice decorates never fakes physics.
- **Compatibility:** Chrome/Edge/Firefox/Safari desktop · iOS Safari · Android Chrome. Touch parity from day one. Existing saves load without migration (no schema bump — bevel/material/quality are ephemeral/render state; detector/starter untouched).
- **Testing:** TDD red→green for `quality.ts` (and any new pure helper for compact thresholds) with ≥80% coverage via `CI=true pnpm vitest run --coverage` scoped to logic modules. Rendering/material/bevel verified via manual verification protocol per `workflow.md` at each phase checkpoint (desktop 1280×720 + touch 393×659). `CI=true pnpm biome check .` + `tsc --noEmit` + `pnpm build` remain green.
- **Accessibility:** Touch targets ≥44px, high-contrast tray, Reduced Motion pulse→static tint, focus-visible on new toggle, labels on hover (desktop) retained.

## Acceptance Criteria

- **AC-1:** On desktop + 393×659 touch, rails show soft beveled highlights and visibly glossier candy plastic vs `master` before/after; bumper/goal-cup unaffected beyond gloss lift.
- **AC-2:** Table reads warmer/satin and shadows are softer vs before, but play area still bright with no dark corners; 1280×720 screenshot + phone screenshot both look toy-like.
- **AC-3:** Disconnect a connector piece → subtle violet pulse visible on phone without squinting; connect it → pulse stops; bumper never pulses. Ready route shows drop→cup glow centered on rails (+20% thicker on phone); breaking the route hides it. Reduced-motion shows static tint only.
- **AC-4:** Quality toggle shows in top-hud, toggles Auto↔High, persists across reload, hot-updates DPR/shadow caps correctly; in Auto on emulated low-memory/battery the renderer stays capped; in High it lifts even on compact.
- **AC-5:** Old saves load; new saves round-trip identical; no save-schema bump; starter track still shows a ready route.
- **AC-6:** `CI=true pnpm vitest run --coverage` ≥80% on new logic, `CI=true pnpm biome check .` clean (all files), `pnpm build` succeeds, `pnpm check:size` within budget and delta ≤2.0/1.2 kB; manual verification on desktop + touch confirms no regression in tray scroll, drop-point landing guide, splitter/bumper, anti-jam nudge/recycle, PWA offline, audio.

## Out of Scope

- New piece types, alternating/randomized splitter routing, or further piece geometry beyond the subtle bevel (no major redesign, no graph changes).
- Procedural wood-grain bump/normal, texture assets, or hand-authored icon/SVG changes.
- Tray pagination redesign, collapsible groups, or new piece colors beyond the existing families.
- Sharing/export/import, challenge modes, marble cosmetics/unlockables, progression systems (explicit product non-goals).
- Music/ambient loops or new SFX beyond shipped procedural one-shots (product non-goal).
- Native app packaging, profiler UI, per-chunk budgets, or Workbox/service-worker changes.
- Save-schema migration — visual/quality state is ephemeral and not persisted to IndexedDB.
