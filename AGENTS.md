# AGENTS.md — oLegal

> **Purpose.** This file teaches software agents (e.g., OpenAI Codex) and human contributors how to work inside the oLegal codebase: how to discover the project layout, set up the environment, run checks, follow conventions, prepare safe/reviewable change sets, and produce context logs for continuous improvement.

> **Scope.** This file lives at the repo root and applies to the entire repository unless a more‑deeply‑nested `AGENTS.md` overrides specific rules.

---

## 0) TL;DR for agents

* **Never push untested code.** Before finishing a task, you **must run all programmatic checks** listed in §7 and ensure they pass.
* **Log every run.** For each task/iteration, create a run folder under `docs/agent-runs/YYYYMMDD-<task-slug>/` and commit:

  * `PLAN.md` (deep plan + constraints), `ACTIONS.md` (chronological steps), `CHECKS.md` (what you ran + results), `DECISIONS.md` (trade‑offs), `DIFF.md` (summary of changes), optional `EVIDENCE/` (snippets, screenshots, outputs). See §15.
* **Use the existing toolchain.** Detect the package manager and scripts (
  `pnpm-lock.yaml` → **pnpm**, `yarn.lock` → **yarn**, otherwise **npm**). Use `run -s`/`--silent` to minimize noise.
* **Do not create branches.** Commit directly on the current branch with small, focused commits. **Do not amend** existing commits (§6).
* **Respect security gates.** CSRF, RLS, CSP and BYOK rules are mandatory (§4, §9).
* **Prefer incremental diffs.** Touch the smallest surface necessary; follow the folder conventions and component patterns in §2–§3.
* **Plan before you code.** Produce and commit `PLAN.md` before making code changes (§16). If you pivot, update it.
* **Self‑improve via proposals.** You may propose edits to this `AGENTS.md` via a **self‑improvement proposal** (ADR) and patch, but only apply changes if the **user explicitly requests** adoption (§17).

---

## 1) Architecture quickfacts

* **Framework:** Next.js 15 (App Router) + React 19 + TypeScript.
* **UI:** Tailwind v4 + shadcn/ui + motion-primitives + prompt‑kit components.
* **AI SDK:** Vercel AI SDK (`ai`) with provider adapters via `@ai-sdk/*` and OpenRouter.
* **Data:** Supabase (Auth, Postgres, Storage). IndexedDB is used as a local cache/fallback.
* **State:** Context providers for user, chats, messages, models, user‑preferences; TanStack Query for async cache.
* **Deploy:** Docker/Docker Compose supported; Vercel-friendly; Ollama optional for local models.

---

## 2) Repository orientation (what to look for)

> Concrete paths may differ slightly; search for these files/dirs before changes.

* **App shell & providers:** `app/layout.tsx` composes providers (TanStackQueryProvider, UserProvider, ModelProvider, ChatsProvider, ChatSessionProvider, UserPreferencesProvider), plus Tooltips/Theme/Sidebar.
* **Auth flow:** `lib/api.ts` (client `signInWithGoogle`), `app/auth/callback/route.ts` exchanges the OAuth code; `validateUserIdentity` decides client (guest vs authenticated).
* **Middleware:** `utils/supabase/middleware.ts` (SSR cookies), project‑level `middleware.ts` (CSP + CSRF enforcement).
* **Security helpers:** `lib/csrf.ts` for CSRF tokens; `lib/sanitize.ts` (DOMPurify + JSDOM on server).
* **Models & providers:** `lib/models/*` (registries and static sets), `lib/openproviders/provider-map.ts`, `lib/openproviders/index.ts` (returns `LanguageModelV1`).
* **Chat API:** `app/api/chat/route.ts` (streaming via `streamText`), with usage logging and persistence hooks.
* **Models API:** `app/api/models/route.ts` (GET list; POST refresh cache).
* **Projects:** `app/api/projects/*`, UI under `app/p/[projectId]/*`.
* **Rate limits:** `lib/config.ts` (limits & free model lists), `lib/usage.ts` (check/increment), `app/api/rate-limits/route.ts`.
* **Keys & BYOK:** `app/components/layout/settings/apikeys/byok-section.tsx`; server endpoints under `app/api/user-keys/*`; crypto in `lib/encryption.ts`.
* **File handling:** `lib/file-handling.ts`, attachments table and client hooks.

If a referenced file is missing, search neighbors or `lib/` for similarly named modules before creating new ones.

---

## 3) Code style & conventions

* **Language:** TypeScript strict. Prefer server components; isolate client‑only logic behind `"use client"`.
* **UI:** shadcn/ui components with Tailwind utility classes; keep components small and composed. Use motion‑primitives for animations.
* **Naming:** Descriptive file/component names; index files only for route entries. Avoid default exports except for Next.js route components.
* **State:** Use provided Context providers and hooks; prefer TanStack Query for async caches.
* **Errors:** Normalize through shared helpers (e.g., `extractErrorMessage`) and return typed errors to the UI.
* **i18n:** Keep user‑facing strings centralized if an i18n layer exists; otherwise keep them grouped per feature.

---

## 4) Security rules (must‑follow)

* **CSRF:** All state‑changing requests must include a valid `x-csrf-token`. Clients mint via `/api/csrf` and `lib/fetch.ts` attaches it. Server middleware enforces presence.
* **CSP:** When adding network calls or loading third‑party assets, update `middleware.ts` CSP allowlists accordingly.
* **BYOK:** User keys are stored encrypted with AES‑256‑GCM (`lib/encryption.ts`, 32‑byte base64 `ENCRYPTION_KEY`). Never log or persist raw secrets.
* **Sanitization:** Sanitize any user‑provided HTML/markup through `lib/sanitize.ts`.
* **RLS:** Supabase row‑level security is assumed on; server functions must always validate identity (guest vs authenticated) before touching data.

---

## 5) Environment & local runs

Two supported modes:

### 5.1 Minimal guest/offline mode (fastest)

* Many features work without Supabase (guest flows + IndexedDB cache). Use this when making pure UI or non‑DB changes.
* Create `.env.local` with only required non‑secret toggles. If server code imports Supabase, guard via the existing `isSupabaseEnabled` checks before executing DB calls.

Note: Some deployments may run with BYOK disabled. In that mode, provider API keys must come from environment variables (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`) and `/api/user-keys` endpoints should be treated as no-ops (e.g., return 403). Ensure UI and server paths tolerate this configuration without requiring encryption keys.

### 5.2 Full stack (Supabase + Docker)

* If `docker-compose.yml` is present, use it to run Postgres + Supabase Studio. Otherwise connect to a dev Supabase project.
* Required env vars (see `.env.example`):

  * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server `SUPABASE_SERVICE_ROLE` (service only on server).
  * `CSRF_SECRET`, `ENCRYPTION_KEY` (32‑byte base64), and any provider keys needed for integration tests.
* **Never commit `.env*` files.**

**Node runtime:** Use Node ≥ 18.18 (recommend 20 LTS). Prefer `pnpm` if lockfile exists.

**Package manager detection:**

```bash
if [ -f pnpm-lock.yaml ]; then PM=pnpm;
elif [ -f yarn.lock ]; then PM=yarn;
else PM=npm; fi
```

---

## 6) Git workflow (agents & humans)

* **No new branches.** Work on the current branch.
* **Commit your changes** (don’t amend existing commits).
* If pre‑commit hooks (Husky/lint‑staged) fail, **fix and retry**.
* **Leave the worktree clean** (`git status` shows no changes) before finishing the task.
* Small, focused commits. Use Conventional Commits where reasonable (`feat:`, `fix:`, `docs:`, `refactor:`…).

---

## 7) Programmatic checks you MUST run (and pass)

> Run these **in order**; skip a step only if the script/tool does not exist in the repo. Prefer `--ci`/non‑interactive flags.

1. **Install deps**

```bash
$PM install
```

2. **Static analysis**

```bash
# Type checking
$PM run -s typecheck || npx tsc -p tsconfig.json --noEmit

# Linting
$PM run -s lint || npx eslint .
```

3. **Unit / component tests**

```bash
# Vitest
$PM run -s test:unit || $PM run -s test || npx vitest run --reporter=dot

# Jest (fallback)
$PM run -s test:ci || npx jest --ci
```

4. **E2E (if present)**

```bash
$PM run -s test:e2e || $PM run -s playwright:test || npx playwright test
```

5. **Build (ensures Next + Tailwind + types work)**

```bash
# Prefer a CI build variant if available
$PM run -s build || npx next build
```

6. **API smoke (optional, local‑only)**

* If `next dev` is used in tests, start it in the background, wait for ready log, then curl

  * `GET /api/models`
  * `GET /api/rate-limits?userId=…&isAuthenticated=…`
  * `POST /api/chat` (dry‑run or mocked providers)

> **Agents:** include test and build logs in your final response as evidence (see §11 Citations).

---

## 8) Typical task recipes

### 8.1 Fix a bug in the chat streaming pipeline

1. Find `app/api/chat/route.ts`. Trace the call to `streamText(...)` and to `storeAssistantMessage`.
2. Ensure `validateAndTrackUsage` is called before invoking the provider and that errors use `extractErrorMessage`.
3. Add/adjust unit tests around the failing path. If no tests exist, create a co‑located `*.test.ts` with minimal fixtures.
4. Run checks (§7) and keep changes tightly scoped.

### 8.2 Add a new language model/provider

1. Add model config under `lib/models/data/<family>.ts` or equivalent, update `lib/openproviders/provider-map.ts` and `lib/openproviders/index.ts` to return a `LanguageModelV1` instance.
2. Decide access flags in `FREE_MODELS_IDS` and ensure BYOK gating is respected (`getModelsWithAccessFlags`).
3. Extend `/api/models` to expose the new model if needed and update UI selection logic (ModelProvider, favorites).
4. Update docs and add a smoke test (request to `/api/models` should include the new model when keys are present).

### 8.3 Add/modify an API route

1. Create file under `app/api/<name>/route.ts`.
2. Enforce **CSRF** for mutations and **identity** via `validateUserIdentity`.
3. If the route affects usage, integrate `checkUsageByModel`/`incrementUsageByModel` appropriately.
4. Update CSP if new upstreams are contacted.
5. Add unit tests (and e2e if user‑visible) and run all checks.

### 8.4 UI change

1. Add/modify components under `app/components/...`; prefer composition with shadcn/ui.
2. Keep components server‑first; mark interactivity with `"use client"` and move heavy logic to server.
3. Ensure styles are Tailwind‑idiomatic; avoid inline styles unless necessary.
4. Write light tests if logicful; otherwise rely on typecheck + build.

### 8.5 File uploads & limits

* Use `lib/file-handling.ts` and `checkFileUploadLimit(userId)`; surface domain errors to the UI.

---

## 9) Security & privacy checklists (pre‑merge)

* [ ] CSRF token validated on all mutations.
* [ ] Supabase calls run with the correct client (guest vs authenticated).
* [ ] BYOK: secrets flow only through `user_keys` endpoints; **never** log keys.
* [ ] Inputs sanitized via `lib/sanitize.ts` when rendering untrusted content.
* [ ] CSP updated for any new external origins.
* [ ] RLS expectations documented when adding tables/queries.

---

## 10) Release/CI checklist

* [ ] `install` → `typecheck` → `lint` → `test` → `build` all pass.
* [ ] Worktree clean after formatting (`git status`).
* [ ] Minimal diff: only files necessary to the task are changed.
* [ ] Commit messages follow Conventional style.
* [ ] If adding models/providers, `/api/models` reflects flags and BYOK behavior.

---

## 11) Pull request (or task) summary format

When you finish, include this summary and evidence. Agents should attach it to their PR/task output.

```
### Summary
- Problem & rationale:
- What changed (high level):
- Risk/impact:

### Tests & checks
- Commands run:
  - <paste exact commands>
- Key outputs (snippets):
  - <test/build excerpts>

### Verification steps for reviewers
- <how to run locally>

### Follow‑ups
- <any TODOs you intentionally left for later>
```

---

## 12) Citations instructions (for agents)

If you browsed files or used terminal commands while completing a task, add citations to your final response where relevant.

* **File citations** use absolute repo‑relative paths:

  * Format: `【F:<file_path>†L<line_start>(-L<line_end>)?】`
  * Example: `The OAuth callback is implemented here【F:app/auth/callback/route.ts†L1-L50】`.
* **Terminal citations** use the chunk id of the terminal output:

  * Format: `【<chunk_id>†L<line_start>(-L<line_end>)?】`
  * Use terminal citations primarily for test/build results.
* **Prefer file citations** when referencing code; use terminal citations only for runtime outputs. Do **not** cite from diffs/comments or use git hashes as chunk ids.

---

## 13) Notes for Codex‑style agents

* Each task runs in an isolated sandbox. **Wait for commands to finish** (or terminate them) before concluding a task.
* Read all `AGENTS.md` files visible from the working directory; deeper ones take precedence.
* If a programmatic check in §7 exists, **you must run it** after your code changes and before committing.
* Keep commits small and the worktree clean; only committed code is evaluated.

---

## 14) Appendix — useful commands (heuristics)

```bash
# Discover scripts
jq -r '.scripts | keys[]' package.json 2>/dev/null || cat package.json

# Choose package manager
[ -f pnpm-lock.yaml ] && PM=pnpm || { [ -f yarn.lock ] && PM=yarn || PM=npm; }

# Run checks (safe defaults)
$PM install
$PM run -s typecheck || npx tsc -p tsconfig.json --noEmit
$PM run -s lint || npx eslint .
$PM run -s test || npx vitest run --reporter=dot || npx jest --ci
$PM run -s build || npx next build
```
---

## 15) Iteration logging & context tracking

Use a single-file log per run.

* **Location:** `docs/agent-runs/`
* **Filename:** `YYYYMMDD-<task-slug>.md` (UTC date, kebab-case slug)
* **Template:**

  ```markdown
  # Iteration Log — <Task Title>

  ## Plan
  <task, assumptions, design sketch, steps, rollback, risks>

  ## Actions (chronological)
  <what changed and why>

  ## Checks & Verification
  | Check | Command | Result | Notes |

  ## Decisions
  <key choices and alternatives>

  ## Diff (high-level)
  <major files touched and purpose>
  ```

* **Purpose:** Transparent, verifiable context for each iteration; keeps PRs concise.
```

### 15.2 `ACTIONS.md` template

```md
# Actions (chronological)

1. **Context load:** Read files A, B, C (why). Key insights: …
2. **Plan approval:** Wrote `PLAN.md`; validated scope vs limits (why).
3. **Edit:** Touched `path/to/file.ts` (why), created `path/to/new.ts` (why).
4. **Run checks:** <commands> (results summarized; details in `CHECKS.md`).
5. **Finalize:** Updated docs/tests; prepared PR summary (§11).
```

### 15.3 `DIFF.md` guidance

* Summarize what changed, not just the git diff; reference modules and behavior.
* Link to key files using repo‑relative paths.

---

## 16) Planning‑first policy (before implementation)

Agents **must** produce a written plan **before** making changes.

**`PLAN.md` template:**

```md
# Plan

**Task:** <one‑line goal>
**Assumptions/Constraints:** env, rate limits, data availability, security gates.
**Design sketch:** architecture notes, impacted modules, alt options.
**Step plan:** numbered steps from smallest viable change to tests and rollout.
**Rollback:** how to revert safely if needed.
**Risks & mitigations:** what could break and how you’ll detect it.
```

* If the plan changes materially, **update `PLAN.md`** and note the pivot in `ACTIONS.md`.
* Keep scope tight; split large work into multiple runs/folders.

---

## 17) Self‑improvement & AGENTS.md evolution

* Agents may draft a **Self‑Improvement Proposal (SIP)** when a recurring friction or better practice is found.
* **Format:** add `docs/proposals/SIP-YYYYMMDD-<slug>.md` with problem, rationale, suggested rule, examples, and impact.
* Agents may also open a patch to `AGENTS.md`, but **MUST NOT merge/apply** it automatically. Adoption requires **explicit user request**.
* Until adopted, treat SIPs as guidance only; cite them in PR summaries as “proposed”.

---

## 18) Autonomy guardrails & context logging

* Stay within **current branch**, repository boundaries, and configured CSP/network rules.
* **No secrets in logs.** Redact API keys and sensitive IDs. Reference them symbolically (e.g., `OPENAI_API_KEY`).
* Prefer **deterministic** commands and `--ci` flags; capture minimal but sufficient evidence in `EVIDENCE/`.
* Keep logs concise; avoid dumping entire test suites—link or cite.


**End of AGENTS.md**
