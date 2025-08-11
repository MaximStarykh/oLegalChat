## oLegal Technical Specification (v0.1)

This document describes the architecture, core flows, data model, security, environment configuration, and API surface of the oLegal project.

### Overview

- Framework: Next.js 15 (App Router), React 19, TypeScript.
- UI: Tailwind (v4), shadcn/ui, motion-primitives, prompt-kit components.
- AI SDK: Vercel AI SDK (`ai`), provider adapters via `@ai-sdk/*` and OpenRouter.
- Data: Supabase (Auth, Postgres, Storage). IndexedDB is used as a local cache/fallback.
- State: Context providers for user, chats, messages, models, user-preferences; TanStack Query for async cache.
- Deployment: Docker/Docker Compose supported; Vercel friendly; Ollama optional for local models.

### Top-level runtime composition

- `app/layout.tsx` composes providers:
  - `TanstackQueryProvider`, `UserProvider` (user profile), `ModelProvider` (models + favorites), `ChatsProvider` (chat list), `ChatSessionProvider` (active chat), `UserPreferencesProvider` (UI and behavior flags), Tooltips, Theme, Sidebar.
  - Optional analytics script if `ZOLA_OFFICIAL=true`.

### Core domains and flows

#### Authentication & Identity

- Supabase-backed auth; Google OAuth sign-in flow:
  - Client triggers `signInWithGoogle` (`lib/api.ts`) → Supabase OAuth → redirect to `/auth/callback`.
  - `app/auth/callback/route.ts` exchanges code for session, ensures user row exists with initial fields, then redirects to `next`.
- Guest users:
  - Anonymous access supported; server uses `createGuestServerClient` (service role) to validate guest `users.anonymous = true` records.
  - `validateUserIdentity(userId, isAuthenticated)` selects proper Supabase client and guarantees the caller’s identity.
- Middleware session sync: `utils/supabase/middleware.ts` integrates Supabase SSR cookie handling via Next middleware.

#### CSRF & Security Headers

- CSRF token: `lib/csrf.ts` provides `generateCsrfToken` and `validateCsrfToken` (`/api/csrf` mints a cookie and returns `{ ok: true }`).
- Middleware enforcement: `middleware.ts` ensures `x-csrf-token` for state-changing requests; client adds it via `lib/fetch.ts`.
- CSP: `middleware.ts` sets environment-aware Content Security Policy, including Supabase origin and AI provider endpoints.
- Sanitization: `lib/sanitize.ts` uses DOMPurify on server with JSDOM to sanitize user inputs when needed.

#### Models & Providers

- Model registry: `lib/models/` exposes static sets for OpenAI, Mistral, Claude, Gemini, Grok, Perplexity, OpenRouter, and Ollama fallback; plus dynamic Ollama detection.
  - `getAllModels()` combines static models with detected Ollama models and caches for 5 minutes.
  - `getModelsWithAccessFlags()` marks free vs pro access based on `FREE_MODELS_IDS` and Ollama availability.
- Provider mapping: `lib/openproviders/provider-map.ts` maps model IDs → provider (`openai`, `mistral`, `google`, `anthropic`, `perplexity`, `xai`, `openrouter`, `ollama`).
- Provider adapters: `lib/openproviders/index.ts` returns `LanguageModelV1` instances for a model ID, optionally with an API key, including Ollama via OpenAI-compatible base URL.
- Models API: `app/api/models/route.ts`
  - GET returns available models; for authenticated users, filters/access flags depend on `user_keys` and BYOK presence; otherwise accessible flags reflect free/pro.
  - POST refreshes model cache.

#### BYOK (Bring Your Own Key)

- Client UI: `app/components/layout/settings/apikeys/byok-section.tsx` manages keys per provider.
- Storage:
  - `app/api/user-keys/route.ts` saves keys into `user_keys` with AES-256-GCM encryption: `lib/encryption.ts` (`ENCRYPTION_KEY` 32-byte base64 required).
  - `lib/user-keys.ts` retrieves effective keys: prefer user key, otherwise env key via `lib/openproviders/env.ts`.
- Effects:
  - On first-time key save, provider models can be added to favorites; model access checks use BYOK presence.

#### Usage & Rate Limiting

- Config: `lib/config.ts` defines limits and free model lists:
  - `NON_AUTH_DAILY_MESSAGE_LIMIT`, `AUTH_DAILY_MESSAGE_LIMIT`, `DAILY_LIMIT_PRO_MODELS`, `NON_AUTH_ALLOWED_MODELS`, `FREE_MODELS_IDS`.
- Server-side checks: `lib/usage.ts`
  - `checkUsageByModel` selects pro vs free path; resets daily counters by UTC day; separate pro usage counter.
  - `incrementUsageByModel` updates counters accordingly.
- REST endpoint: `app/api/rate-limits/route.ts` exposes daily usage for a `userId` and auth flag; used by client notifications.
- Enforcement during chat: `app/api/chat/api.ts` → `validateAndTrackUsage` ensures model eligibility (auth vs non-auth, BYOK requirement) and calls usage checks.

#### Chat Flow

- Frontend state and UX:
  - `app/components/chat/chat.tsx` orchestrates Hooks:
    - `useChats()` (list + create/update/delete), `useMessages()` (per-chat messages), `useModel()` (model selection), file upload hooks, `useChatOperations()` (ensure chat, limits, edit/delete), and `useChatCore()` (bridges to AI SDK `useChat`).
  - `useChatCore` configures `useChat` with `api: /api/chat`, handles prompt prefill via URL, error normalization, file attachments, submit/reload, and draft persistence.
  - Messages provider caches in IndexedDB and fetches from Supabase when enabled; optimistically appends while streaming.
- Backend streaming pipeline: `app/api/chat/route.ts`
  - Validates identity/usage; records user message (`logUserMessage`) and increments counts.
  - Resolves model via registry and determines API key via `getEffectiveApiKey(userId, provider)` for authenticated users.
  - Streams via `streamText({ model: modelConfig.apiSdk(apiKey, { enableSearch }), system, messages, tools, maxSteps })`.
  - `onFinish` persists assistant messages via `storeAssistantMessage` into `messages` table.
  - Errors surfaced through `extractErrorMessage` and `createErrorResponse`.

#### Messages & Chats Persistence

- Chats:
  - Client: `lib/chat-store/chats/provider.tsx` with optimistic create/update/delete, IndexedDB cache sync.
  - Server APIs: `/api/create-chat` (create with optional `projectId`), `/api/update-chat-model`.
- Messages:
  - Client: `lib/chat-store/messages/provider.tsx` manages per-chat message list; reads/writes cache; fetches from Supabase when enabled.
  - Server: `logUserMessage` on user POST; `storeAssistantMessage` on AI finish.

#### Projects & Multi-Model

- Projects API: `app/api/projects/route.ts` (create/list), `app/api/projects/[projectId]/route.ts` (get/rename/delete) with auth checks.
- Project UI: `app/p/[projectId]/project-view.tsx` integrates chat UX scoped to a project; ensures chat creation on first message.
- Multi-model chat: `app/components/multi-chat/*` uses N parallel `useChat` instances; submits the same prompt to selected models, grouping responses by `message_group_id`.

#### File Handling

- `lib/file-handling.ts` exposes `checkFileUploadLimit(userId)` and related errors (e.g., `FileUploadLimitError`), used by upload flows.
- Attachments metadata stored in `chat_attachments` table; client-side optimistic attachments managed by `use-file-upload`.

### API Surface (App Router)

- Chat:
  - `POST /api/chat` — stream chat completion; usage enforcement; logging/persisting.
  - `POST /api/create-chat` — create chat row (optional `projectId`).
  - `POST /api/update-chat-model` — update chat model.
- Models & Providers:
  - `GET /api/models` — list models with access flags; `POST /api/models` refresh cache.
  - `POST /api/providers` — check if user has BYOK for a provider.
- Preferences & Keys:
  - `GET/PUT /api/user-preferences` — read/update UI prefs.
  - `GET/POST /api/user-preferences/favorite-models` — read/update favorites.
  - `POST /api/user-keys` — save encrypted BYOK.
  - `GET /api/user-key-status` — status of available keys.
- Projects:
  - `GET/POST /api/projects` — list/create projects.
  - `GET/PUT/DELETE /api/projects/[projectId]` — CRUD per project.
- Rate limits:
  - `GET /api/rate-limits?userId=...&isAuthenticated=true|false`.
- Security:
  - `GET /api/csrf` — mint and set CSRF cookie.

Notes: Some endpoints may be no-ops when Supabase is disabled; handlers return a 200 with an explanatory payload to keep the UI functional offline.

### Data Model (Supabase)

See `INSTALL.md` for full SQL. Key tables:

- `users`: profile, counters, preferences link; includes `anonymous`, `premium`, daily counters & reset timestamps.
- `projects`: user-owned containers for chats.
- `chats`: `user_id`, optional `project_id`, `title`, `model`, `system_prompt`, timestamps, `public`.
- `messages`: `chat_id`, `user_id`, `role`, `content`, `experimental_attachments` (JSONB), `parts` (JSONB), `message_group_id`, `model`.
- `chat_attachments`: metadata for uploaded files.
- `user_keys`: BYOK per provider, `encrypted_key` and `iv`.
- `user_preferences`: UI/behavioral preferences per user.

RLS: Enable row-level security and policies as per `INSTALL.md` guidance.

### Environment Configuration

Required/used env vars (see `.env.example` and `INSTALL.md`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`.
- CSRF: `CSRF_SECRET`.
- Providers: `OPENAI_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`.
- BYOK encryption: `ENCRYPTION_KEY` (32 bytes base64).
- Ollama: `OLLAMA_BASE_URL` (server), `DISABLE_OLLAMA`.
- Deployment flags: `ZOLA_OFFICIAL`, `NEXT_PUBLIC_VERCEL_URL`.

`isSupabaseEnabled` gates DB-backed features: app remains usable (guest mode + IndexedDB cache) without Supabase.

### Frontend State & UX Contracts

- Chat session: `ChatSessionProvider` tracks active `chatId` used across `ChatsProvider` and `MessagesProvider`.
- Messages contract: messages carry optional `model` and `message_group_id` to support multi-model grouping.
- Model selection: `useModel` reads available models with `accessible` flags; updates chat model via `/api/update-chat-model`.
- Preferences: `UserPreferencesProvider` initializes from user profile; updates via REST.

### Error Handling & UX Messaging

- API streaming errors normalized with `extractErrorMessage` and surfaced to UI to avoid raw provider errors.
- Usage limit errors use codes such as `DAILY_LIMIT_REACHED` with status 403; UI surfaces actionable toasts.

### Security Considerations

- CSRF protection enforced for mutations via middleware + `fetchClient` header.
- BYOK stored encrypted at rest (AES-256-GCM) with per-record IV; masking on display.
- Sanitization applied to user-provided content before use where applicable.
- CSP restricts network/script/image sources; Supabase cookies handled carefully in middleware and server clients.

### Performance Considerations

- Model list cached for 5 minutes; dynamic Ollama detection guarded and falls back to static models.
- Chats/messages cached in IndexedDB to minimize DB reads and improve perceived latency.
- Multi-model chat limits maximum active models and reuses a fixed array of chat hooks.

### Extensibility Guidelines

- Adding a new provider/model family:
  - Add model configs under `lib/models/data/*` and update `provider-map` if new.
  - Ensure `openproviders` supports the provider (or add an adapter).
  - Decide free/pro classification in `FREE_MODELS_IDS` and surface access flags.
- Adding tools/function calling:
  - Supply tool definitions to `streamText` (`tools: ToolSet`) and gate using `cleanMessagesForTools`.
- Adding storage-backed features:
  - Guard with `isSupabaseEnabled` and provide IndexedDB fallback where feasible.

### Open Questions / Next Iteration

- Finalize tool invocation UX and server tool registry.
- Consolidate rate-limiting endpoints vs direct `lib/usage` calls for consistency.
- Expand health checks (`/api/health`) and observability.

— End of v0.1 —


