# 20240813 - Codebase Recovery

## PLAN

**Objective:** Recover the codebase from its broken state. The `main` branch is unstable and contains multiple linting and type errors. The previous attempt to audit and fix resulted in catastrophic failure. This plan outlines a methodical recovery process.

1.  **Stabilize the Base:** The immediate priority is to fix all existing errors on the current `HEAD` (commit `da04145`). No new features or audits will be performed until the codebase is stable.
2.  **Incremental Fixes:** Address one error category at a time, starting with the simplest ones.
    *   Fix unused variable errors.
    *   Fix Next.js `<img>` warnings.
    *   Fix `any` type errors.
3.  **Continuous Verification:** After each file is modified, run `type-check` and `lint` to ensure the fix is effective and introduces no regressions.
4.  **Final Full Check:** Once all individual errors are resolved, run the full test and build suite as specified in `AGENTS.md`.

## ACTIONS

*   `✅`: Update `run.md` with recovery plan.
*   `✅`: Fix unused variables.
*   `(pending)`: Fix `<img>` warnings.
*   `(pending)`: Fix `any` type errors.
*   `(pending)`: Run final checks.

## CHECKS

*   `✅`: `run.md` updated.
*   `✅`: All unused variable errors fixed.
*   `(pending)`: All `<img>` warnings fixed.
*   `(pending)`: All `any` type errors fixed.
*   `(pending)`: All checks pass.

## DIFF

*   (pending) Summary of changes will be added here.
