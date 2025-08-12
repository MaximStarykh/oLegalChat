import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

// Restricted to ONLY two models: gemini-2.5-flash and gemini-2.0-flash
const geminiModels: ModelConfig[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    providerId: "google",
    modelFamily: "Gemini",
    baseProviderId: "google",
    description: "Fast, responsive model for general tasks.",
    tags: ["fast", "multimodal"],
    contextWindow: 1000000,
    vision: true,
    webSearch: true,
    tools: true,
    audio: true,
    reasoning: false,
    openSource: false,
    speed: "Fast",
    intelligence: "Medium",
    website: "https://ai.google.dev",
    apiDocs: "https://ai.google.dev/api",
    modelPage: "https://ai.google.dev",
    icon: "gemini",
    apiSdk: (apiKey?: string, opts?: { enableSearch?: boolean }) =>
      openproviders("gemini-2.5-flash", opts as unknown as any, apiKey),
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    providerId: "google",
    modelFamily: "Gemini",
    baseProviderId: "google",
    description: "Low-latency model optimized for speed.",
    tags: ["fast"],
    contextWindow: 1000000,
    vision: true,
    webSearch: true,
    tools: true,
    audio: true,
    reasoning: false,
    openSource: false,
    speed: "Fast",
    intelligence: "Medium",
    website: "https://ai.google.dev",
    apiDocs: "https://ai.google.dev/api",
    modelPage: "https://ai.google.dev",
    icon: "gemini",
    apiSdk: (apiKey?: string, opts?: { enableSearch?: boolean }) =>
      openproviders("gemini-2.0-flash", opts as unknown as any, apiKey),
  },
]

export { geminiModels }
