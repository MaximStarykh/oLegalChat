export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY!,
  // Accept either GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY
  GOOGLE_GENERATIVE_AI_API_KEY:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "",
  // Expose GEMINI_API_KEY explicitly for endpoints that reference it directly
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  XAI_API_KEY: process.env.XAI_API_KEY!,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
}

// BYOK disabled: always use env keys, ignore userKeys
export function createEnvWithUserKeys(): typeof env {
  return { ...env }
}
