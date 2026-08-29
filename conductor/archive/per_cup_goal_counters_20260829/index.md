# Track: Per-Cup Goal Counters

- **ID:** `per_cup_goal_counters_20260829`
- **Type:** Feature
- **Status:** Complete
- **Branch:** `feat/per_cup_goal_counters_20260829`
- **Final checkpoint:** `2c32a29`

## Documents

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Summary

Close the gap between `product.md`'s core-loop promise ("goal-cup counters show how
your build performs") and today's global-only tally: each placed goal cup gets a
session-scoped count, shown as a floating toy-styled chip anchored above the cup via
camera projection. Pure tally logic is TDD'd in `src/sim/goals.ts`; the label layer
is presentation glue verified manually. Counts reset with the table/save load and
are not persisted (save schema stays v2).
