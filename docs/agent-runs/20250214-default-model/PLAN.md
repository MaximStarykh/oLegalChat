Task: Fix bug where logged-in users see empty model selector; ensure default model is gemini-2.5-flash when no valid model is selected.

Plan:
1. Investigate cause of empty model selector for logged-in users.
2. Identify logic selecting model: `useModel` hook currently returns chat model or user's first favorite or `MODEL_DEFAULT` without validating existence.
3. Modify `useModel` to ensure selected model exists in current model registry; if chat model or favorite model is invalid, fall back to `MODEL_DEFAULT`.
4. Update tests (if needed) or add regression test to ensure logged-in users default to gemini-2.5-flash when their favorite model is unavailable.
5. Run repository checks: install, typecheck, lint, test, build.
6. Document actions and commit changes including run logs.
