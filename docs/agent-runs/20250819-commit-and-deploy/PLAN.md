# Goal
Commit current changes to GitHub main and trigger Vercel deployment, following AGENTS.md checks.

# Plan
1. Create this run folder and document plan/actions/checks/diff.
2. Detect package manager and install dependencies deterministically.
3. Run typecheck, lint, unit tests, and production build.
4. Commit minimal diff with a Conventional Commit message.
5. Push to origin/main to trigger Vercel deploy.
6. Record results (commit hash, CI/deploy status if available).
