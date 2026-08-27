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
- [ ] **Task 1.2: Async physics chunk + boot flow** *(logic-bearing)*
  - TDD: unit-test the boot state machine first (loading → ready | load-failed →
    retry) — red → green
  - Move `createPhysics()` behind a dynamic import; scene/HUD activate on resolve;
    friendly retry state on first-visit failure
  - Branded inline loading screen in `index.html` (CSS-only bouncing marble,
    `prefers-reduced-motion` respected), fading out on ready
- [ ] **Task 1.3: Re-baseline budgets** *(docs)*
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
