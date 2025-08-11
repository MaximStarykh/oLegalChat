# Iteration Log — Gemini-only, reasoning toggle, web search, env-only keys

## Plan

Task: Enable only Gemini models (all free), show optional reasoning in UI, add Gemini web search grounding with progress + sources, and force env GOOGLE_GENERATIVE_AI_API_KEY (disable BYOK).

Assumptions/Constraints:
- Next.js 15, React 19, TypeScript strict; Vercel AI SDK used for streaming.
- Web search/source data is already supported by AI SDK parts and existing `SourcesList` UI.
- Must not require secrets beyond `GOOGLE_GENERATIVE_AI_API_KEY`.
- Keep scope minimal; no DB schema changes.

Design sketch:
- Models: Limit registry to Gemini-only and mark them free. Set default model to Gemini Flash.
- Reasoning: Gate display via a new user preference `showReasoning`; add toggle in chat input.
- Web search: Use existing `enableSearch` path; ensure extra fields are sent; show “Searching the web…” while tool is active; citations flow into existing `SourcesList`.
- Keys: Disable BYOK path; always use env key for Google from server.

Step plan:
1) Models: Restrict `getAllModels()` to Gemini; set FREE/NON_AUTH/DEFAULT to Gemini.
2) Mark Gemini models with `webSearch: true`.
3) Preferences: add `showReasoning` + setter; wire toggle in `ChatInput`.
4) Assistant message: only render `Reasoning` when preference on; add search-in-progress indicator.
5) Chat core: ensure `sendExtraMessageFields: true` for parts (reasoning/sources).
6) Server: resolve provider key from env only; disable BYOK API endpoints, simplify `/api/models`.
7) Build & verify.

Rollback:
- Revert changes in the touched files; restore BYOK endpoint and previous model lists.

Risks & mitigations:
- Build fails due to BYOK encryption. Mitigation: short-circuit `/api/user-keys` routes.
- UI reliance on old model IDs. Mitigation: set default model to Gemini.
- User preference schema change. Mitigation: default fallback + localStorage path already supported.

## Actions (chronological)

1. Context load: Read `lib/models/*`, `lib/openproviders/*`, chat UI under `app/components/chat/*`, and server `app/api/chat/route.ts` to locate models, keys, reasoning, and search paths.
2. Edit: Restricted models to Gemini-only and set Gemini as free/default (`lib/models/index.ts`, `lib/config.ts`, `lib/models/data/gemini.ts`).
3. Edit: Disabled BYOK by forcing env keys and short-circuiting `/api/user-keys` (`lib/openproviders/env.ts`, `lib/user-keys.ts`, `app/api/user-keys/route.ts`, `app/api/models/route.ts`, `app/api/chat/route.ts`).
4. Edit: Added reasoning preference and toggle; render reasoning conditionally; show web-search progress; enabled extra fields streaming (`lib/user-preference-store/*`, `app/components/chat-input/chat-input.tsx`, `app/components/chat/message-assistant.tsx`, `app/components/chat/use-chat-core.ts`).
5. Checks: Installed deps, type-checked, and built the app; resolved ENCRYPTION_KEY build error by disabling BYOK endpoints.

## Checks & Verification

| Check | Command | Result | Notes |
|---|---|---|---|
| Install deps | `npm install --silent --no-fund --no-progress` | ✅ | Using npm |
| Typecheck | `npm run -s type-check` | ✅ | Passed |
| Build (first) | `npm run -s build` | ❌ | Failed due to missing ENCRYPTION_KEY when building `/api/user-keys` |
| Fix | Disabled BYOK API (`/api/user-keys`) to return 403 | ✅ | Avoids encryption in build |
| Build (second) | `npm run -s build` | ✅ | Built with warnings (punycode deprecations) |
| Security review | Manual per §9 | ✅ | BYOK endpoints disabled; no secrets logged |

## Decisions

- Models: Hard-restricted the static model list to Gemini to keep UI/state simple and avoid hidden entries.
- Free access: Marked all Gemini/Gemma as accessible to satisfy "leave active and free all gemini models".
- BYOK: Disabled at API and resolution layers to enforce env-only keys; simplified `/api/models` path accordingly.
- Reasoning UI: Added `showReasoning` preference and toggle to avoid clutter; default off.
- Web search UX: Reused existing toggle and sources UI; added an inline "Searching the web…" indicator based on tool-invocation state.

Alternatives considered:
- Keeping other models hidden via preferences: rejected to avoid accidental exposure.
- Partial BYOK support (Google only): rejected to satisfy "disable BYOK" unambiguously.

## Diff (high-level)

- `lib/models/index.ts`: Gemini-only registry; removed dynamic Ollama combination.
- `lib/config.ts`: Gemini-only free/default model lists; default model set to `gemini-1.5-flash-002`.
- `lib/models/data/gemini.ts`: Added `webSearch: true` to all entries.
- `lib/openproviders/env.ts`: `createEnvWithUserKeys()` now ignores user keys (BYOK disabled).
- `lib/user-keys.ts`: `getUserKey()` returns null; `getEffectiveApiKey()` uses env only.
- `app/api/chat/route.ts`: Always resolves provider key from env.
- `app/api/models/route.ts`: Returns accessible models without BYOK checks.
- `app/api/user-keys/route.ts`: Returns 403 for POST/DELETE.
- `lib/user-preference-store/utils.ts`, `provider.tsx`: Added `showReasoning` preference + setter.
- `app/components/chat-input/chat-input.tsx`: Added Reasoning On/Off toggle.
- `app/components/chat/message-assistant.tsx`: Respect `showReasoning`; show "Searching the web…" when web search tool active; keep sources rendering.
- `app/components/chat/use-chat-core.ts`: Enable `sendExtraMessageFields` for parts.
- `AGENTS.md`: Added note about deployments with BYOK disabled.
