# Project Workflow

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2. **The Tech Stack is Deliberate:** Changes to the tech stack must be documented in `tech-stack.md` *before* implementation
3. **Test Logic, Verify Visuals:** Unit tests (TDD) are required for **logic-bearing modules only** — anything with rules, state, or data (e.g., track graph, connector snapping, save serialization, spawner state machine, undo/redo command stack). Rendering, camera, and input-glue code is verified through the manual verification protocol instead.
4. **Targeted Code Coverage:** Aim for **~80% coverage of logic-bearing modules**. Rendering/UI glue is excluded from coverage targets.
5. **User Experience First:** Every decision should prioritize user experience (see `product-guidelines.md`)
6. **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use `CI=true` for watch-mode tools (tests, linters) to ensure single execution.

## Task Workflow

All tasks follow a strict lifecycle:

### Standard Task Workflow

1. **Select Task:** Choose the next available task from `plan.md` in sequential order

2. **Mark In Progress:** Before beginning work, edit `plan.md` and change the task from `[ ]` to `[~]`

3. **Write Failing Tests First (logic-bearing tasks):**
   - If the task touches a logic-bearing module: create/extend its test file, define expected behavior as unit tests, run them, and confirm they fail ("Red" phase). Do not implement until tests exist and fail.
   - If the task is purely visual/rendering/input glue: skip this step; proceed to implementation and rely on the phase-end manual verification protocol.

4. **Implement to Pass Tests (Green Phase):**
   - Write the minimum application code necessary to make failing tests pass.
   - Rerun the test suite and confirm all tests pass.

5. **Refactor (Optional but Recommended):**
   - With passing tests as safety net, improve clarity and remove duplication without changing behavior. Rerun tests after.

6. **Verify Coverage (logic-bearing code changed):**
   - Run `pnpm vitest run --coverage` scoped to logic modules.
   - Target: ≥80% on new/changed logic code.

7. **Document Deviations:** If implementation differs from tech stack:
   - **STOP** implementation
   - Update `tech-stack.md` with the new design and a dated note explaining the change
   - Resume implementation

8. **Commit Code Changes (per task):**
   - Stage all changes related to the task.
   - One completed task = one commit. Message format: `feat(scope): description` (see Commit Guidelines).

9. **Attach Task Summary with Git Notes:**
   - Get the just-completed commit hash (`git log -1 --format="%H"`).
   - Draft a summary: task name, summary of changes, files created/modified, core "why".
   - Attach: `git notes add -m "<note content>" <commit_hash>`

10. **Record Task Completion in Plan:**
    - In `plan.md`, update the task from `[~]` to `[x]`, append the first 7 chars of the commit hash, and add brief implementation notes under the task entry.

11. **Commit Plan Update:**
    - Stage `plan.md`; commit as `conductor(plan): Mark task '<task>' as complete`.

### Task Correction & Plan Amendment Workflows

1. **In-Flight Refinements:** Minor gaps found while a task is `[~]` are fixed directly in the active stream, with passing tests before committing.
2. **Code Review Corrections (`conductor-review`):** Review findings append a `Review Fixes` phase to `plan.md` so corrections are formally tracked.
3. **Logical State Reversions (`conductor-revert`):** Fundamentally flawed tasks are reverted via git revert; task status resets to `[ ]` for a clean restart.

### Phase Completion Verification and Checkpointing Protocol

**Trigger:** Executed immediately after a task completes that also concludes a phase in `plan.md`.

1. **Announce Protocol Start:** Inform the user the phase is complete and checkpointing has begun.

2. **Ensure Test Coverage for Phase Changes:**
   - Determine phase scope via the previous phase's checkpoint SHA in `plan.md` (or first commit if none).
   - List changed files: `git diff --name-only <previous_checkpoint_sha> HEAD`.
   - For each changed **logic-bearing module**, verify a corresponding test file exists; if missing, create one following existing test conventions, validating this phase's planned functionality.
   - Pure rendering/visual files are exempt from this requirement (manual verification covers them).

3. **Execute Automated Tests:**
   - Announce the exact command first (e.g., "Running test suite: `CI=true pnpm vitest run`"), then execute.
   - On failure: inform the user and attempt at most two proposed fixes; if still failing, stop and ask for guidance.

4. **Propose a Detailed Manual Verification Plan:**
   - Derive user-facing goals from `product.md` + `product-guidelines.md` + `plan.md`.
   - Present step-by-step instructions with exact commands and expected outcomes, e.g.:
     ```
     The automated tests have passed. For manual verification:
     1. Start dev server: `pnpm dev`
     2. Open http://localhost:5173 (desktop) AND a phone/touch-emulated viewport
     3. Confirm: [specific expected visuals/interactions for this phase]
     ```

5. **Await Explicit User Feedback:** Pause and ask: *"Does this meet your expectations? Please confirm with yes or provide feedback."* Do not proceed without explicit confirmation.

6. **Identify Target Commit:** Use the last functional commit of the phase (no empty checkpoint commits).

7. **Attach Verification Report via Git Notes:** Full report — test command, results, manual steps, user confirmation — attached to the target commit.

8. **Record Phase Checkpoint SHA:** Append `[checkpoint: <sha7>]` to the phase heading in `plan.md`; write back.

9. **Commit Plan Update:** `conductor(plan): Mark phase '<PHASE NAME>' as complete`.

10. **Announce Completion.**

## Quality Gates

Before marking any task complete, verify:

- [ ] All automated tests pass
- [ ] New/changed logic-bearing code meets ≥80% coverage
- [ ] Code follows style guides in `code_styleguides/`
- [ ] Public functions/methods documented (JSDoc/TSDoc where non-obvious)
- [ ] TypeScript strict mode passes with no errors
- [ ] Biome reports no lint/format errors (`CI=true pnpm biome check .`)
- [ ] Works correctly on mobile viewport (if user-facing)
- [ ] No security issues introduced (we ship no secrets; validate any URL/user-text handling)

## Development Commands

### Setup

```bash
pnpm install        # install dependencies
```

### Daily Development

```bash
pnpm dev            # Vite dev server
CI=true pnpm vitest run          # run all tests once
CI=true pnpm biome check .       # lint + format check
pnpm build          # production static build
pnpm preview        # serve the production build locally
```

### Before Committing

```bash
CI=true pnpm biome check . && CI=true pnpm vitest run && pnpm build
```

## Testing Requirements

### Unit Testing (mandatory for logic-bearing modules)

- Every pure-logic module (track graph, snapping, serialization, spawner FSM, undo stack) gets Vitest tests written *before* implementation.
- Test success and failure cases; mock external dependencies (IndexedDB wrapper, Rapier world).
- Save/load serialization needs round-trip property tests (save → load → save produces identical output).
- Rendering components, materials, cameras, pointer→raycast glue: no unit test requirement.

### Manual Verification (visual & interactive work)

- Verified at phase checkpoints via the manual verification protocol above.
- Always include both desktop and touch/mobile viewport checks when user-facing.

### Mobile Checks

- Touch interactions tested (real device or emulation)
- Layout readable at phone sizes without zoom
- Framerate sanity-check when marbles are running (~15–20 concurrent)

## Commit Guidelines

### Message Format

```
<type>(<scope>): <description>

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting only
- `refactor`: Neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Maintenance tasks
- `conductor(plan)`: Plan/status updates

### Examples

```bash
git commit -m "feat(track): Add curve piece geometry generator"
git commit -m "test(snapping): Cover port occupancy rejection cases"
git commit -m "fix(camera): Stop chase cam jitter at high marble speeds"
```

## Definition of Done

A task is complete when:

1. All code implemented to specification
2. Unit tests written (where logic-bearing) and passing
3. Coverage meets requirements for changed logic code
4. Documentation updated if applicable
5. Biome and TypeScript checks pass cleanly
6. Works on mobile viewport (if user-facing)
7. Implementation notes added to `plan.md`
8. Changes committed with proper message
9. Git note with task summary attached

## Deployment Workflow (static site)

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Production build succeeds (`pnpm build`)
- [ ] Biome clean
- [ ] Mobile spot-check on the built output (`pnpm preview`)
- [ ] Bundle size within budget noted in tech-stack.md

### Steps

1. Merge to main
2. Push / deploy static output to host (GitHub Pages / Netlify / Cloudflare Pages)
3. Verify deployed URL loads and plays correctly on desktop + phone

## Continuous Improvement

- Review workflow fit after each track
- Document lessons learned in plan notes
- Keep things simple and maintainable
