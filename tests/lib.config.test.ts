import { describe, it, expect } from "vitest"
import {
  NON_AUTH_ALLOWED_MODELS,
  FREE_MODELS_IDS,
  MODEL_DEFAULT,
} from "@/lib/config"

describe("lib/config (Gemini-only settings)", () => {
  it("default model is a Gemini model", () => {
    expect(MODEL_DEFAULT).toContain("gemini")
  })

  it("non-auth and free lists contain only Gemini/Gemma ids", () => {
    expect(NON_AUTH_ALLOWED_MODELS.length).toBeGreaterThan(0)
    expect(NON_AUTH_ALLOWED_MODELS.every((id) => id.includes("gemini") || id.includes("gemma"))).toBe(true)
    expect(FREE_MODELS_IDS.length).toBeGreaterThan(0)
    expect(FREE_MODELS_IDS.every((id) => id.includes("gemini") || id.includes("gemma"))).toBe(true)
  })
})


