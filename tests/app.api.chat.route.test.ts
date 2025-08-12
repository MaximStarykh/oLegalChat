import { describe, it, expect, vi } from "vitest"
// Minimal mock of ai.streamText (must be defined before importing route)
vi.mock("ai", () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response("", { status: 200 })),
  })),
}))

import * as modelsModule from "@/lib/models"
import * as providerMap from "@/lib/openproviders/provider-map"
import * as userKeys from "@/lib/user-keys"
import * as chatApiModule from "@/app/api/chat/api"
import { POST } from "@/app/api/chat/route"

describe("/api/chat POST", () => {
  it("validates input and returns 400 on missing fields", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("resolves model and uses env-only key, streams response", async () => {
    vi.spyOn(chatApiModule, "validateAndTrackUsage").mockResolvedValue(null as any)
    vi.spyOn(modelsModule, "getAllModels").mockResolvedValue([
      {
        id: "gemini-2.5-flash",
        apiSdk: vi.fn(() => ({ id: "providerModel" })),
      },
    ] as any)
    vi.spyOn(providerMap, "getProviderForModel").mockReturnValue("google" as any)
    vi.spyOn(userKeys, "getEffectiveApiKey").mockResolvedValue("ENV_KEY")

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        chatId: "c1",
        userId: "u1",
        model: "gemini-2.5-flash",
        isAuthenticated: false,
        systemPrompt: "",
        enableSearch: true,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})


