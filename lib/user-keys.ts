import { decryptKey } from "./encryption"
import { env } from "./openproviders/env"
import { Provider } from "./openproviders/types"
import { createClient } from "./supabase/server"

export type { Provider } from "./openproviders/types"
export type ProviderWithoutOllama = Exclude<Provider, "ollama">

// BYOK disabled: never return a user key
export async function getUserKey(
  _userId: string,
  _provider: Provider
): Promise<string | null> {
  return null
}

export async function getEffectiveApiKey(
  _userId: string | null,
  provider: ProviderWithoutOllama
): Promise<string | null> {
  const envKeyMap: Record<ProviderWithoutOllama, string | undefined> = {
    openai: env.OPENAI_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    perplexity: env.PERPLEXITY_API_KEY,
    // Prefer GOOGLE_GENERATIVE_AI_API_KEY; fall back to GEMINI_API_KEY
    google: env.GOOGLE_GENERATIVE_AI_API_KEY || env.GEMINI_API_KEY || undefined,
    anthropic: env.ANTHROPIC_API_KEY,
    xai: env.XAI_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
  }
  return envKeyMap[provider] || null
}
