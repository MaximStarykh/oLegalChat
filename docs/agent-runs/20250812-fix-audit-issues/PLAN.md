# Plan

## Goal
Fix issues identified in code audit: duplicate dependency, unsafe `any` usage, excessive debug logging, and untyped API routes.

## Steps
1. Remove duplicate `@google/generative-ai` entry from `package.json`.
2. Refactor `app/api/chat/route.ts`:
   - Replace `any` types with structured types.
   - Eliminate debug `console.log` statements.
3. Improve typing for API routes:
   - `app/api/search/route.ts`: validate query parameters with `zod` and remove `any`.
   - `app/api/user-preferences/route.ts`: use `zod` to validate request body and replace `any` in update object.
4. Replace remaining `any` usages in `app/api/chat/utils.ts` with typed alternatives.
5. Update documentation logs (`ACTIONS.md`, `CHECKS.md`, `DIFF.md`).
6. Run full test suite: install, type-check, lint, test, build.

## Risks
- Additional lint errors may appear after type adjustments.
- Tests may still fail due to existing ESM issues.
- Refactoring may introduce runtime type mismatches if assumptions about external APIs are incorrect.

