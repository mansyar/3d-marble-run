# Implementation Plan: Toy Visual Polish — Subtle Bevel & Material Retune

Roadmap to make the toy set read as glossy candy-plastic on a warm studio table while reclaiming mobile legibility — all inside a ~1.5 kB min headroom. Ordering is deliberate: bevel/materials first (biggest visual win, isolated to builders/materials), then table/light (scene-local), then guidance (depends on health.ts), then quality toggle (new logic-bearing core with UI), closing with docs + full gate. Visual glue follows manual verification; any new pure helper follows TDD red→green per `workflow.md`.

## Phase 1 · Piece Bevel & Candy-Glass Material Retune [checkpoint: TBD]

- [ ] Task: Write failing material-reference tests (optional logic pin) — pin current `PIECE_COLORS` shade families and that `≤6 hues` invariant still holds after retune; if added helper `isCompactViewport` for guidance, write its RED tests now. Confirm RED before implementation.
  - [ ] Capture existing `src/pieces/materials.ts` exports in a test (hues, roughness/metal defaults) to lock no hue-family regression.

- [ ] Task: Retune candy-glass materials `feat(materials): retune plastic gloss per family`
  - [ ] In `src/pieces/materials.ts` lower roughness `0.35→0.28` for primaries, keep metalness ≤0.05, bump envMapIntensity `1.0→1.2`; keep `#8338ec` Drop accent and ≤6 hues; shape still differentiates.
  - [ ] Verify by `pnpm build` + `pnpm check:size` delta <0.4 kB for this slice; visual diff on desktop before/after.

- [ ] Task: Add subtle bevel to rail edges `feat(builders): add 0.02–0.04 chamfer to rails`
  - [ ] In `src/pieces/builders.ts` (+ trimesh helper) inset rail edge loops by 0.02–0.04 on straight/curve/ramp/splitter and funnel rim; keep segment counts; bumper dome + goal-cup lip untouched; collider stays trimesh-accurate.
  - [ ] Ensure no new dependency; `pnpm build` delta <0.6 kB; 20-marble stream still smooth.

- [ ] Task: Cover changed logic and commit Phase 1
  - [ ] `CI=true pnpm biome check .` clean; `CI=true pnpm vitest run` green (244+); `pnpm check:size` within ≤3,500/1,250.
  - [ ] Commit `feat(materials): subtle bevel + candy-glass retune`; git note with bevel + gloss summary.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Run full suite once; propose manual verification: desktop 1280×720 before/after (rails highlights + gloss pop), 393×659 touch legibility, starter track ready route still glows correctly.
  - [ ] Await explicit user confirmation; record phase checkpoint SHA in `plan.md`.

## Phase 2 · Table & Lighting Retune [checkpoint: TBD]

- [ ] Task: Retune table and studio light `feat(scene): warm satin table + softer studio light`
  - [ ] In `src/render/scene.ts` tweak table material roughness `0.9→0.85` (color `#c79a63` ±3%), Hemisphere `0.9→0.95`, set `sun.shadow.radius=2` for PCFSoft softness; keep shadowMapSize caps (1024 compact / 2048 desktop) and positions; bump `PMREMGenerator` env capture `0.04→0.06` with proper dispose.
  - [ ] No grain/shader noise; no asset; verify init cost <5 ms.

- [ ] Task: Commit Phase 2
  - [ ] Biome clean; build + check:size within budget (delta <0.3 kB); screenshot diff checked.
  - [ ] Commit `feat(scene): warm satin table and softer studio lighting`; git note.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Full suite green; manual verification desktop + touch: table reads warmer/satin, shadows softer penumbra, plastic gloss catches specular, no dark corners, 20-marble perf ≥55 fps.
  - [ ] Await user confirmation; record checkpoint SHA.

## Phase 3 · Guidance Compact Legibility Boost [checkpoint: TBD]

- [ ] Task: Write failing tests for compact guidance helper (extend `track/health.ts` or small helper) `test(guidance): compact boost thresholds`
  - [ ] Helper `isCompactGuidanceViewport()` or thresholds for emissive/radius — RED: compact true → guidance recommends boosted values, desktop false → base values, reduced-motion always returns static fallback flag.
  - [ ] Confirm RED.

- [ ] Task: Implement guidance compact boost `feat(guidance): boost pulse and glow on compact viewports`
  - [ ] In `src/render/guidance.ts` raise unreachable-pulse emissive +20% and TubeGeometry radius +20% only when `compactViewport` (≤768 or maxTouchPoints>0); honor `prefers-reduced-motion` static tint; exempt portless bumpers + Drop point; recompute only on graph/drop edits; additive blending unchanged.

- [ ] Task: Cover changed logic and commit Phase 3
  - [ ] `pnpm vitest run --coverage` ≥80% on new helper/logic; biome clean; build + check:size delta <0.4 kB.
  - [ ] Commit `feat(guidance): compact legibility boost for pulse and glow`; git note.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Full suite green; manual verification: disconnect piece → visible pulse on 393×659, connect → stops, bumper never pulses; ready route → glow centered + thicker on phone, hides when broken; reduced-motion static tint confirmed.
  - [ ] Await user confirmation; record checkpoint SHA.

## Phase 4 · Quality Preference & Auto Toggle [checkpoint: TBD]

- [ ] Task: Write failing tests for quality preference (logic-bearing, TDD-mandatory) `test(quality): Auto vs High resolution and persistence`
  - [ ] New `src/core/quality.ts`: `getQualityMode()` defaults "auto" from localStorage, `setQualityMode()` persists, `resolveQuality({compact, deviceMemory, battery}, mode)` returns `{dprCap,shadowSize}` — cases: compact→cap, deviceMemory≤4→cap in auto, battery<0.2+!charging→cap in auto, High forces desktop values; injectable storage for tests; no Three imports. Confirm RED (≥8 cases).

- [ ] Task: Implement quality preference logic `feat(quality): add Auto/High resolver with persistence`
  - [ ] Implement `src/core/quality.ts` exactly per tests; handle missing `getBattery`/`deviceMemory` fallbacks; wire `localStorage` key `marblescape:quality`; GREEN + ≥80% coverage on changed code.

- [ ] Task: Wire quality into scene boot and hot-update `feat(scene): wire quality caps into renderer`
  - [ ] Modify `src/render/scene.ts` `initScene` to read `resolveQuality` before `WebGLRenderer` creation (antialias, dprCap, shadowSize); expose hot-update path so toggling from UI calls `renderer.setPixelRatio` and updates `sun.shadow.mapSize` without reload.

- [ ] Task: Implement quality toggle UI (visual glue) `feat(ui): add Auto/High quality toggle`
  - [ ] Top-hud icon button next to `soundToggle` (reuse `top-hud` pattern), ≥44px, `aria-label` "Quality: Auto/High", `aria-pressed`, one button only, persisted; communicates via `quality.ts`; respects `product-guidelines.md` minimal HUD.

- [ ] Task: Cover changed logic and commit Phase 4
  - [ ] `pnpm vitest run --coverage` ≥80% on `quality.ts`; `CI=true pnpm biome check .` clean; build + check:size delta <0.6 kB (logic + one button).
  - [ ] Commit `feat(quality): Auto/High quality preference with battery-aware capping`; git note.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Full suite green; manual verification desktop + 393×659 touch: toggle visible at ≥44px, toggles Auto↔High, persists after reload, hot-updates DPR/shadows; Auto caps on stubbed low-memory/battery (use `deviceMemory=2` stub + `getBattery` mock), High lifts; PWA/tray guidance unaffected.
  - [ ] Await user confirmation; record checkpoint SHA.

## Phase 5 · Docs & Release Readiness [checkpoint: TBD]

- [ ] Task: Update product docs `docs(polish): update product and README for toy polish`
  - [ ] If `product.md` or `product-guidelines.md` guidance/render description drifts, update minimally (bevel/gloss + lighting + quality toggle allowance already permits the toggle — note it explicitly if missing). Update README toy description + PWA/payload bulleted details if needed; keep tone kid-safe, sentence-case.

- [ ] Task: Final quality gate `chore(quality-gate): polish track final verification`
  - [ ] Run `CI=true pnpm vitest run --coverage` (logic ≥80% on quality + helpers), `CI=true pnpm biome check .`, `tsc --noEmit`, `pnpm build`, `pnpm check:size` within ≤3,500 min / ≤1,250 gzip and delta ≤2.0/1.2 kB vs baseline at branch point; document final bundle in plan notes.
  - [ ] Full manual protocol desktop (1280×720) + touch (393×659): starter ready route, tray scroll, Splitter/Bumper placement + bounce, anti-jam nudge/recycle, guidance pulse/glow with new legibility, quality toggle, save/autosave, PWA offline, audio SFX; confirm 20-marble stream fluidity.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Present manual verification results + automated gate output; await explicit user confirmation that polish meets "proudly say play my game" bar.
  - [ ] Record final phase checkpoint SHA in `plan.md`.

