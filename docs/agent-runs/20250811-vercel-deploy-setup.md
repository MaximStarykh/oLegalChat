# Iteration Log — GitHub + Vercel deploy, CI workflow, and build fix

## Plan

Task: Automate deployment to GitHub + Vercel, add CI for prod deploys, and fix Next.js build types to ensure production build succeeds on Vercel.

Assumptions/Constraints:
- Next.js 15 (App Router), React 19, TypeScript strict.
- BYOK disabled; provider API keys via environment only.
- Keep changes minimal; no app logic changes.

Design sketch:
- Initialize repo; add `.gitignore` to avoid large files.
- Create Vercel project via CLI; add minimal `vercel.json`.
- Add GitHub Actions workflow to deploy on push to `main`.
- Fix TypeScript build on Vercel by excluding tests and test-only types.

Step plan:
1) Init git, push to GitHub.
2) Link and deploy to Vercel via CLI.
3) Add CI workflow and helper script for envs.
4) Adjust `tsconfig.json` to exclude tests and test types.
5) Re-deploy and verify.

Rollback:
- Revert `.github/workflows/*`, `vercel.json`, `tsconfig.json`.

Risks & mitigations:
- Large files in history: re-init git and push clean tree.
- Vercel build failing on test types: exclude tests and remove test-only types.

## Actions (chronological)

1. Added `.gitignore`, `vercel.json`, `scripts/vercel-setup.sh`, and CI workflow `.github/workflows/vercel-deploy.yml`.
2. Initialized git, created GitHub repo, and pushed clean history.
3. Linked Vercel project (`olegalchat`) and triggered deploy.
4. Build failed due to test types; updated `tsconfig.json` to exclude tests and remove test-only type entries.
5. Re-deployed; build completed successfully.

## Checks & Verification

| Check | Command | Result | Notes |
|---|---|---|---|
| First deploy | `vercel --prod --yes` | ❌ | TS error from `vitest`/`@testing-library/jest-dom` types in build |
| Fix & redeploy | `vercel --prod --yes` | ✅ | Build completed; routes and serverless functions generated |

## Decisions

- Use minimal `vercel.json` (let defaults handle Next.js build).
- Exclude tests and remove test-only types from TS build on Vercel.
- Keep BYOK disabled; require env keys only.

## Diff (high-level)

- `.gitignore`: ignore `node_modules`, `.vercel`, `.env*` (keep example), build outputs.
- `vercel.json`: minimal Next.js config (build/install/output).
- `.github/workflows/vercel-deploy.yml`: deploy on `main` with optional env passthrough via repo secrets.
- `scripts/vercel-setup.sh`: helper to set Vercel envs non-interactively and deploy.
- `tsconfig.json`: exclude `tests` and remove test-only types.
