# Marblescape — Technology Stack

## Overview

Web-first, zero-backend, fully offline. Every runtime asset is procedurally generated in code — the shipped product is a static bundle of JS/WASM/CSS/HTML only.

| Layer | Choice | Rationale |
|---|---|---|
| **Language** | TypeScript (strict mode) | Type-safe glue between physics, rendering, and UI; catches connector-graph bugs at compile time |
| **Build tool** | Vite | Instant dev server/HMR, optimized static output, easy PWA-ready structure |
| **Rendering** | Three.js (r1xx, monthly release train) | Lightweight scene graph, first-class procedural geometry, best mobile-perf headroom |
| **Physics** | Rapier3D (`@dimforge/rapier3d-compat`) | Rust→WASM engine; stable rolling-sphere contacts and stacked bodies — the make-or-break requirement for marbles |
| **Storage** | IndexedDB (via tiny `idb` wrapper) | Async local auto-save + named slots; no backend, survives refreshes |
| **UI layer** | Vanilla TS + DOM overlay over canvas | Minimal HUD doesn't justify a framework's bundle cost; CSS handles styling |
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

- **Zero external runtime assets:** all geometry and materials generated in code — no textures, models, or audio files shipped
- **Payload:** keep total transfer small enough to feel instant on a mid-range phone connection; set a precise measured budget during implementation (Rapier's embedded WASM is the biggest single chunk)
- **Browser support:** current versions of Chrome, Edge, Firefox, Safari (desktop) · iOS Safari · Android Chrome
- **Input parity:** every mouse interaction must have a touch equivalent from day one
