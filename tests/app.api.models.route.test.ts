import { describe, it, expect, vi } from "vitest"
import * as modelsModule from "@/lib/models"
import { GET, POST } from "@/app/api/models/route"

describe("/api/models route", () => {
  it("GET returns models with accessible=true", async () => {
    const mockModels = [
      { id: "gemini-1.5-flash-002", providerId: "google" },
    ] as any
    const spy = vi.spyOn(modelsModule, "getAllModels").mockResolvedValue(mockModels)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = JSON.parse(await res.text())
    expect(json.models).toEqual([{ id: "gemini-1.5-flash-002", providerId: "google", accessible: true }])
    spy.mockRestore()
  })

  it("POST refreshes cache and returns models", async () => {
    const spyRefresh = vi.spyOn(modelsModule, "refreshModelsCache").mockImplementation(() => {})
    const spyAll = vi
      .spyOn(modelsModule, "getAllModels")
      .mockResolvedValue([{ id: "gemini-1.5-flash-002" }] as any)
    const res = await POST()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe("Models cache refreshed")
    expect(Array.isArray(json.models)).toBe(true)
    spyRefresh.mockRestore()
    spyAll.mockRestore()
  })
})


