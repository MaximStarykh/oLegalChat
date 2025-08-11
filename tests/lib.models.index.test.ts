import { describe, it, expect, beforeEach } from "vitest"
import {
  getAllModels,
  getModelsWithAccessFlags,
  getModelInfo,
  refreshModelsCache,
  MODELS,
} from "@/lib/models"

describe("lib/models (Gemini-only)", () => {
  beforeEach(() => {
    refreshModelsCache()
  })

  it("exposes only Gemini/Gemma models statically", async () => {
    const staticIds = MODELS.map((m) => m.id)
    expect(staticIds.length).toBeGreaterThan(0)
    expect(staticIds.every((id) => id.includes("gemini") || id.includes("gemma"))).toBe(true)
  })

  it("getAllModels returns only Gemini models and caches results", async () => {
    const first = await getAllModels()
    const second = await getAllModels()
    expect(first).toEqual(second)
    expect(first.every((m) => m.providerId === "google")).toBe(true)
  })

  it("getModelsWithAccessFlags marks all as accessible", async () => {
    const models = await getModelsWithAccessFlags()
    expect(models.length).toBeGreaterThan(0)
    expect(models.every((m) => m.accessible === true)).toBe(true)
  })

  it("getModelInfo can fetch by id from cache or static", async () => {
    const all = await getAllModels()
    const sample = all[0]
    const info = getModelInfo(sample.id)
    expect(info?.id).toBe(sample.id)
  })
})


