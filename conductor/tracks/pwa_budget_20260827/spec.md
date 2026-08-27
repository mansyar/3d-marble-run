# Spec — Installable PWA & Payload Budget Hardening

**Track ID**: `pwa_budget_20260827` · **Type**: FEATURE · **Status**: new · **Branch**: `feat/pwa-budget`

## Overview

Two goals delivered as one track because the second depends on the first: (1) reclaim
bundle headroom — v0.2.0 sits at 3,437.74 kB min / 1,244.96 kB gzip against a
≤3,500 / ≤1,250 kB budget, ~5 kB from the ceiling — by splitting Rapier + its WASM out
of the initial chunk; (2) ship a full installable PWA shell that makes product.md's
"fully offline" pillar literal: manifest, build-generated icons, and a precaching
service worker, with a CI gate so headroom never silently erodes again.

## Functional Requirements

- **FR-1 — Async physics chunk.** `createPhysics()` moves behind a dynamic import;
  Rapier + WASM load as a separate cacheable chunk. The app boots without it and
  enables play when physics is ready. A load failure on first visit shows a friendly
  retry state (kid-safe copy, no dead end).
- **FR-2 — Branded loading screen.** Inline in `index.html` so it paints before any
  JS: "Marblescape" title + bouncing marble via CSS, honoring
  `prefers-reduced-motion`; fades out when the app is ready. Zero image assets.
- **FR-3 — Web manifest.** Name "Marblescape", display `standalone`, orientation
  `any`, theme/background colors from the warm-wood palette, referencing generated
  icons + favicon + apple-touch icon.
- **FR-4 — Icon pipeline.** A single source-of-truth SVG (glossy candy-glass marble
  on warm wood, per product-guidelines) is rasterized at build time to 192px, 512px,
  and maskable PNGs by a dev script. No hand-maintained binaries; generated PNGs ship
  in `dist/`.
- **FR-5 — Service worker.** Precaches all hashed build output + `index.html`,
  cache-first. Silent auto-update on new deploys (`skipWaiting` + `clients.claim`) —
  no interruption to play. Disabled in dev. Deliberate devDependency choice (e.g.,
  `vite-plugin-pwa`) documented in tech-stack.md **before** implementation (workflow
  rule 2).
- **FR-6 — Hard-fail budget gate.** A `scripts/` check parses built `dist/` totals
  (minified + gzip, global across chunks) and fails non-zero when over budget, wired
  into the existing CI and release workflows after build. Budgets re-baselined in
  tech-stack.md post-split.

## Non-Functional Requirements

- **NFR-1**: Re-baselined budgets recorded in tech-stack.md; initial (pre-physics) JS
  payload materially smaller than today's 3,437 kB min.
- **NFR-2**: Zero external runtime assets, with the *documented exception* of
  manifest + SW + generated icon PNGs (amend tech-stack.md constraint wording first).
- **NFR-3**: Offline after first successful load: airplane-mode reload is fully
  playable; save slots (already IndexedDB-local) work unchanged.
- **NFR-4**: New/changed logic (size-gate script, loading/retry state logic)
  unit-tested ≥80% per workflow; round-trip verified for the gate (oversized build →
  fail).
- **NFR-5**: Biome clean, strict TS, full suite green; mobile viewport verification
  for loading + install flows.

## Acceptance Criteria

- **AC-1**: First paint shows the branded loading state instantly, fading to the
  playable starter track — desktop + mobile.
- **AC-2**: Rapier/WASM served as a separate chunk; global min/gzip totals within
  re-baselined budget.
- **AC-3**: Chrome DevTools reports installable; install works on desktop Chrome +
  Android; Add-to-Home-Screen verified on iOS Safari.
- **AC-4**: Airplane-mode reload fully playable on a previously visited device.
- **AC-5**: A new deploy silently updates cached clients on next load.
- **AC-6**: The CI gate fails an intentionally oversized build and passes the real
  one.
- **AC-7**: Manual perf checkpoint: 15–20 marbles stay smooth on a mid-range phone
  (verify-only; no optimization work in this track).

## Out of Scope

- Runtime performance *fixes* beyond the verification checkpoint (its own track if
  profiling finds issues)
- Push notifications, background sync, per-chunk budgets, Workbox customization
  beyond defaults
- Changes to the release pipeline beyond wiring in the size gate
- Native packaging (still a product non-goal)
