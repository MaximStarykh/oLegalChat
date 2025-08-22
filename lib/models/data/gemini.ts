import { MODELS_CONFIG } from "@/lib/config"
import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

// Build Gemini models from centralized MODELS_CONFIG
const geminiModels: ModelConfig[] = MODELS_CONFIG.map((m) => ({
  ...m,
  apiSdk: (apiKey?: string) => openproviders(m.id as any, undefined as any, apiKey),
}))

export { geminiModels }
