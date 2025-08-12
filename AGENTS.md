# AGENTS.md — oLegal

**Purpose:** Teach software agents and human contributors how to work in the oLegal codebase: project layout, setup, checks, conventions, change sets, and context logging. This file applies to the entire repository.

---

## 0) TL;DR for Agents

*   **Plan First:** Before coding, create and commit `PLAN.md` in a run folder. See §5.
*   **Log Everything:** For each task, create a run folder under `docs/agent-runs/YYYYMMDD-<task-slug>/` and log your `PLAN`, `ACTIONS`, `CHECKS`, and a `DIFF` summary.
*   **Run All Checks:** Before finishing, you **must** run all checks in §4 and ensure they pass. **Never push untested code.**
*   **Use Existing Tools:** Detect the package manager (`pnpm`, `yarn`, `npm`) and use its scripts.
*   **Commit to Current Branch:** Do not create branches or amend existing commits.
*   **Respect Security:** Follow CSRF, RLS, CSP, and BYOK rules (§2).
*   **Incremental Diffs:** Touch the smallest code surface necessary.

---

## 1) Core Concepts

### Architecture & Stack
*   **Framework:** Next.js 15 (App Router), React 19, TypeScript.
*   **UI:** Tailwind CSS v4, shadcn/ui, motion-primitives.
*   **AI:** Vercel AI SDK (`ai`), OpenRouter.
*   **Data:** Supabase (Auth, Postgres, Storage), with IndexedDB for local caching.
*   **State:** React Context providers, TanStack Query for async operations.

### Repository Layout
*   **App Shell/Providers:** `app/layout.tsx`
*   **Auth Flow:** `lib/api.ts`, `app/auth/callback/route.ts`
*   **Middleware (CSP/CSRF):** `middleware.ts`
*   **Security Helpers:** `lib/csrf.ts`, `lib/sanitize.ts`, `lib/encryption.ts`
*   **Model/Chat APIs:** `app/api/models/route.ts`, `app/api/chat/route.ts`
*   **Model Logic:** `lib/models/*`, `lib/openproviders/*`
*   **BYOK (Keys):** `app/api/user-keys/*` and UI in `app/components/layout/settings/`

### Code Conventions
*   **Language:** TypeScript (strict). Prefer server components; use `"use client"` only for client-side interactivity.
*   **UI:** Compose small components using shadcn/ui and Tailwind utility classes.
*   **State:** Use provided context hooks and TanStack Query. Avoid local `useState` for server-cached data.
*   **Exports:** Avoid default exports, except for Next.js route/page components.

---

## 2) Security Rules (Mandatory)

*   **CSRF:** All state-changing requests (POST, PUT, DELETE) must include an `x-csrf-token`. Middleware enforces this.
*   **CSP:** If adding external assets or network calls, update the Content Security Policy in `middleware.ts`.
*   **BYOK:** User-provided API keys are encrypted (AES-256-GCM). **Never log or expose raw secrets.** Use `lib/encryption.ts`.
*   **Sanitization:** Sanitize all user-provided HTML/markup with `lib/sanitize.ts` before rendering.
*   **RLS:** Assume Supabase Row-Level Security is enabled. Always validate user identity on the server before data access.

---

## 3) Local Workflow

### Environment Setup
1.  **Detect Package Manager:**
    ```bash
    if [ -f pnpm-lock.yaml ]; then PM=pnpm;
    elif [ -f yarn.lock ]; then PM=yarn;
    else PM=npm; fi
    ```
2.  **Install Dependencies:** `$PM install`
3.  **Configure Environment:** Copy `.env.example` to `.env.local` and fill in required variables (Supabase keys, `CSRF_SECRET`, `ENCRYPTION_KEY`). **Never commit `.env.local`**.

### Git Workflow
*   Work directly on the current branch. **Do not create new branches.**
*   Make small, atomic commits using the Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`).
*   **Do not amend or force-push** to existing commits.
*   Leave the worktree clean (`git status` shows no uncommitted changes) before finishing.

---

## 4) MANDATORY CHECKS & VERIFICATION

Run these checks **in order** after any code change and before finishing the task. All must pass.

### A. Programmatic Checks
```bash
# 1. Install dependencies (if not already done)
$PM install

# 2. Type Checking
$PM run -s typecheck || npx tsc --noEmit

# 3. Linting
$PM run -s lint || npx eslint .

# 4. Unit & Component Tests
$PM run -s test || npx vitest run --reporter=dot || npx jest --ci

# 5. End-to-End Tests (if configured)
$PM run -s test:e2e || npx playwright test

# 6. Production Build
$PM run -s build || npx next build
```

### B. Final Review Checklist
*   [ ] **Security:** All rules from §2 are met.
*   [ ] **Minimal Diff:** Only necessary files were changed.
*   [ ] **Logging:** Run folder (`docs/agent-runs/...`) is complete with `PLAN.md`, `ACTIONS.md`, etc.
*   [ ] **Cleanliness:** Code is formatted and the worktree is clean.

---

## 5) Planning & Logging Workflow

This process is mandatory for transparency and continuous improvement.

1.  **Create Run Folder:** Before starting, create a new directory: `docs/agent-runs/YYYYMMDD-<task-slug>/`.
2.  **Plan First:** Inside the run folder, create and commit `PLAN.md`.
    *   **Content:** Task goal, constraints, high-level design, step-by-step implementation plan, and risks.
3.  **Log Actions:** As you work, chronologically document your steps in `ACTIONS.md`. Include files read, edits made, commands run, and key decisions.
4.  **Log Checks & Diffs:** After running checks, summarize the commands and results in `CHECKS.md`. Summarize the overall change in `DIFF.md`.
5.  **Commit Logs:** Commit the run folder and its contents along with your code changes.

---

## 6) Agent-Specific Rules

### Citations
When referencing code or terminal output, use citations.
*   **File:** `【F:path/to/file.ts†L1-L10】`
*   **Terminal:** `【<chunk_id>†L1-L5】` (Use for command outputs like test results).

### Self-Improvement
*   You may propose improvements to this `AGENTS.md` by creating a Self-Improvement Proposal (SIP) in `docs/proposals/`.
*   You may also submit a patch, but **do not apply it automatically**. It requires explicit user approval.

### Guardrails
*   Operate only within the current repository and branch.
*   **Never log secrets.** Redact API keys and PII from all logs (`PLAN.md`, `ACTIONS.md`, etc.).
*   Use deterministic flags (e.g., `--ci`) where possible.

---

## 7) Task Recipes

*   **Fix API Bug:** Isolate the route in `app/api/...`. Add a regression test. Validate inputs and user identity. Run all checks.
*   **Add a Model:** Edit `lib/models/` and `lib/openproviders/`. Check access flags (`FREE_MODELS_IDS`, BYOK). Verify it appears in `/api/models`.
*   **UI Change:** Modify/add components in `app/components/`. Use shadcn/ui and Tailwind. Keep components server-first, marking interactive ones with `"use client"`.