import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

// Only Gemini 2.5 Flash available
const geminiModels: ModelConfig[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    providerId: "google",
    modelFamily: "Gemini",
    baseProviderId: "google",
    description: "Advanced AI model for legal analysis and research.",
    tags: ["flagship", "multimodal", "legal"],
    contextWindow: 1000000,
    vision: true,
    webSearch: true,
    tools: true,
    audio: true,
    reasoning: false,
    openSource: false,
    speed: "Fast",
    intelligence: "High",
    website: "https://ai.google.dev",
    apiDocs: "https://ai.google.dev/api",
    modelPage: "https://ai.google.dev",
    icon: "gemini",
    apiSdk: (
      apiKey?: string,
      opts?: { enableSearch?: boolean; enableReasoning?: boolean }
    ) => openproviders("gemini-2.5-flash", opts as unknown as any, apiKey),
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    providerId: "google",
    modelFamily: "Gemini",
    baseProviderId: "google",
    description: "Most capable model for complex reasoning and analysis.",
    tags: ["flagship", "multimodal", "reasoning"],
    contextWindow: 1000000,
    vision: true,
    webSearch: true,
    tools: true,
    audio: true,
    reasoning: true,
    openSource: false,
    speed: "Medium",
    intelligence: "High",
    website: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-pro",
    apiDocs: "https://ai.google.dev/api",
    modelPage: "https://cloud.google.com/vertex-ai/docs/models/gemini/2-5-pro",
    icon: "gemini",
    apiSdk: (
      apiKey?: string,
      opts?: { enableSearch?: boolean; enableReasoning?: boolean }
    ) => openproviders("gemini-2.5-pro", opts as unknown as any, apiKey),
  },
]

export { geminiModels }
