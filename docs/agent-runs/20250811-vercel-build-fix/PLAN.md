# Iteration Log — Vercel build fix

## Plan
- Read AGENTS.md
- Fix TS build failing on Vercel by excluding tests and removing test-only types from tsconfig.json
- Re-deploy to Vercel

## Actions (chronological)
1. Read AGENTS.md.
2. Edited tsconfig.json to exclude tests and remove vitest types; then removed @testing-library/jest-dom types as well.
3. Committed and pushed to GitHub to trigger Vercel.
4. Triggered manual Vercel prod deploy.

## Checks & Verification
| Check | Command | Result | Evidence |
|---|---|---|---|
| Build | vercel --prod --yes | ❌ | Initial failure due to test types |
| Build | vercel --prod --yes | ❌ | Failure due to @testing-library/jest-dom types |

## Decisions
- Exclude tests and test-related types from production TypeScript build.

## Diff (high-level)
- tsconfig.json: removed test-only types and excluded tests from build.
