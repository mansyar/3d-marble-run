# Marblescape — Technology Stack

## Overview

Web-first, zero-backend, fully offline. Every runtime media asset is procedurally generated in code — the shipped product is a static bundle of JS/WASM/CSS/HTML plus the PWA shell chrome (web manifest, service worker, generated icon PNGs).

| Layer | Choice | Rationale |
|---|---|---|
| **Language** | TypeScript (strict mode) | Type-safe glue between physics, rendering, and UI; catches connector-graph bugs at compile time |
| **Build tool** | Vite | Instant dev server/HMR, optimized static output, easy PWA-ready structure |
| **Rendering** | Three.js (r1xx, monthly release train) | Lightweight scene graph, first-class procedural geometry, best mobile-perf headroom |
| **Physics** | Rapier3D (`@dimforge/rapier3d-compat`) | Rust→WASM engine; stable rolling-sphere contacts and stacked bodies — the make-or-break requirement for marbles |
| **Storage** | IndexedDB (via tiny `idb` wrapper) | Async local auto-save + named slots; no backend, survives refreshes |
| **UI layer** | Vanilla TS + DOM overlay over canvas | Minimal HUD doesn't justify a framework's bundle cost; CSS handles styling |
| **Audio** | Web Audio API (native) | Procedural one-shot SFX synthesized in code (oscillators/envelopes) — no samples, no assets, ~zero bundle cost; v2-deferred per product.md, shipped with the Procedural Audio track |
| **PWA shell** | `vite-plugin-pwa` (dev dep) + build-generated icons | Manifest + precache service worker for installability/offline; icons rasterized at build from a single source SVG via `@resvg/resvg-js` (dev dep) — no hand-maintained binaries |
| **Testing** | Vitest | Fast TS-native unit tests for pure logic: track graph, snapping rules, save serialization, spawner state machine |
| **Hosting** | Any static host (GitHub Pages / Netlify / Cloudflare Pages) | Zero server logic required |

## Toolchain

- **Node.js** LTS
- **pnpm** as package manager (fast, strict, disk-efficient)
- **Biome** for linting + formatting — single unified toolchain replacing ESLint + Prettier
- No monorepo — single Vite app

## Version Policy

- Use **latest stable** of every dependency, resolved via `pnpm add` when scaffolding begins (exact pins recorded in `package.json`, never hardcoded in docs)
- three.js moves on a monthly `rXXX` train — upgrade deliberately, one minor bump per track if convenient, never mid-track
- Rapier's WASM/JS binding packages version independently of the Rust core — always match the `-compat` package to its own changelog

## Constraints & Budgets

- **Zero external runtime media assets:** all 3D geometry, materials, and audio generated in code — no textures, models, or audio files shipped. Documented exception (since `pwa_budget_20260827`): PWA shell chrome only — web manifest, service worker, and icon PNGs rasterized at build time from the source SVG.
- **Payload:** V1 budget is ≤3,600 kB minified / ≤1,260 kB gzip, measured globally
  across all emitted chunks by `pnpm check:size`, which hard-fails CI and releases
  on violation. Re-baselined 2026-08-28 in `marble_engine_scaleup_20260828` from the
  original ≤3,500 / ≤1,250 set by `pwa_budget_20260827`: the payload is dominated by
  Rapier's embedded WASM, and per-track JS deltas of a few kB kept tripping the old
  round cap (this track's gate measured 3,502.35 kB min / 1,248.60 kB gzip —
  headroom 97.65 / 11.40 kB under the new budget). Since `pwa_budget_20260827`, the
  physics runtime (Rapier + embedded WASM) lives in an async `app` chunk fetched
  behind the boot screen; the shipped `v0.3.0` build measured 3,493.13 kB min /
  1,245.57 kB gzip in total, with an initial entry chunk of only 2.60 kB min /
  1.26 kB gzip (plus 10.10 kB CSS and the HTML shell). The app chunk remains
  dominated by Rapier's embedded WASM.
- **Mobile rendering:** compact/touch viewports cap DPR at 1.5, disable antialiasing, and use 1024px shadows; desktop retains DPR 2 and 2048px shadows.
- **Simulation capacity (2026-08-28, `marble_engine_scaleup_20260828`):** the marble population cap is tier-aware — 40 marbles on capped/touch tiers, 60 on desktop (`resolveMarbleCap`), applied at boot and re-resolved live when the quality preference changes; shrinking recycles the oldest marbles first. Marble meshes and rigid bodies are pooled (`src/sim/marblePool.ts`): released pairs park asleep offscreen and redeploy like fresh spawns instead of being destroyed. The continuous stream is paced by a frame-budget governor (`createFrameBudget`): sustained frame overage pauses only stream advancement, while manual drops always respond.
- **Browser support:** current versions of Chrome, Edge, Firefox, Safari (desktop) · iOS Safari · Android Chrome
- **Input parity:** every mouse interaction must have a touch equivalent from day one
