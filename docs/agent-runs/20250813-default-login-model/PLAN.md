# Plan

1. **Goal**: Ensure that when a user logs in, the Gemini 2.5 Flash model is set as their default model.
2. **Approach**:
   - Update `app/auth/callback/route.ts` to enforce `favorite_models` = `[MODEL_DEFAULT]` for new users and for existing users lacking a favorite model.
3. **Steps**:
   - Fetch current user record during login callback.
   - If no record exists, insert one with `favorite_models` containing the default model.
   - If record exists but `favorite_models` is empty, update it to `[MODEL_DEFAULT]`.
   - Leave existing non-empty preferences unchanged.
4. **Testing**: Run `npm install`, `npm run type-check`, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`.
5. **Risks**: Supabase errors or unexpected schema issues. Mitigation: log errors and fallback gracefully.
