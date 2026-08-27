# Plan — Installable PWA & Payload Budget Hardening

**Track**: `pwa_budget_20260827` · **Spec**: [./spec.md](./spec.md) ·
**Workflow rules apply** (TDD red→green, one task = one commit + git note, ≥80%
coverage on changed logic, plan status updates `[ ]` → `[~]` → `[x] <sha7>`)

## Phase 1 — Payload Split & Loading Experience

- [x] **Task 1.1: TDD bundle-size gate** *(logic-bearing)* — `96519cc`
  - Notes: TDD red→green — 15 tests on pure helpers (`sumTotals`, `evaluateBudget`, `formatKB`, `exitCodeFor`, `BUDGETED_EXTENSIONS`); `.d.mts` sibling keeps tsc strict green. `pnpm check:size` wired after build in ci.yml + release.yml. Verified: 198/198 suite, biome clean, tsc clean; real build 3,451.58 kB min / 1,231.89 kB gzip within budget (exit 0); oversize probe exits 1 (AC-6). Changed-logic coverage 100%; CLI fs/argv glue exempt per workflow.
  - Write failing unit tests for the size-gate core logic: dist aggregation incl.
    gzip, global budget comparison, exit codes
  - Implement `scripts/check-bundle-size.mjs` (zero new deps, matching
    `check-release-version.mjs` conventions); add `pnpm check:size`
  - Wire into `.github/workflows/ci.yml` + `release.yml` after the build step,
    enforcing the current ≤3,500 kB min / ≤1,250 kB gzip budget immediately
- [x] **Task 1.2: Async physics chunk + boot flow** *(logic-bearing)* — `7dfed56`
  - Notes: TDD red→green — 10 tests on `src/core/boot.ts` controller (loading → ready | failed, guarded begin/retry, transition-only notifications). Whole former `main.ts` moved verbatim to `src/app.ts`, loaded via dynamic import from a 27-line `src/main.ts` bootstrap — Rapier/WASM + all rapier value importers (builders, landing) now live in the async chunk. Static `#boot-screen` in `index.html` (CSS bouncing marble, zero assets) paints pre-JS; kid-safe retry panel on failure; `prefers-reduced-motion` honored. Gates: 208/208, tsc/biome clean; entry chunk 2.57 kB min / 1.25 kB gzip, app chunk 3,441.50 kB min / 1,246.17 kB gzip.
  - TDD: unit-test the boot state machine first (loading → ready | load-failed →
    retry) — red → green
  - Move `createPhysics()` behind a dynamic import; scene/HUD activate on resolve;
    friendly retry state on first-visit failure
  - Branded inline loading screen in `index.html` (CSS-only bouncing marble,
    `prefers-reduced-motion` respected), fading out on ready
- [x] **Task 1.3: Re-baseline budgets** *(docs)* — see Task 1.4 commit
  - Notes: tech-stack.md Payload constraint now documents the chunked architecture: global totals via `pnpm check:size` (constants unchanged at 3,500/1,250 kB), measured post-split 3,455.12 kB min / 1,233.29 kB gzip, entry chunk 2.57 kB min / 1.25 kB gzip + 9.78 kB CSS + HTML shell.
  - Build, measure post-split min+gzip totals; update tech-stack.md payload section
    + gate constants; record measured numbers in plan notes
- [ ] **Task 1.4: Phase Verification & Checkpoint** *(refer to workflow.md)*

## Phase 2 — Installable PWA Shell

- [ ] **Task 2.1: Tech-stack amendments before implementation** *(workflow rule 2)*
  - Document `vite-plugin-pwa` + icon rasterizer as devDependencies and the
    manifest/SW/icon-PNG asset exception
- [ ] **Task 2.2: Icon pipeline** *(logic-bearing config)*
  - TDD pure parts first (icon size set → manifest entries generation)
  - Source SVG: glossy candy-glass marble on warm wood; build script rasterizes
    192px, 512px + maskable PNGs into `dist/`
- [ ] **Task 2.3: Web manifest + HTML head links** *(visual glue)*
  - name/short_name "Marblescape", `standalone`, orientation `any`, theme/background
    colors; favicon + apple-touch-icon wired in `index.html`
- [ ] **Task 2.4: Service worker** *(glue)*
  - `vite-plugin-pwa`: precache all hashed assets + `index.html`, cache-first,
    `autoUpdate` (skipWaiting + clients.claim), disabled in dev
- [ ] **Task 2.5: Docs touch-ups**
  - product.md: clarify installability stays optional ("installable-free" wording);
    README: PWA usage + size-gate sections
- [ ] **Task 2.6: Phase Verification & Checkpoint** *(refer to workflow.md)*
  - Manual protocol: install on desktop Chrome + Android (AC-3), iOS
    Add-to-Home-Screen, airplane-mode reload (AC-4), silent SW update across deploys
    (AC-5), 20-marble mobile perf checkpoint (AC-7)
