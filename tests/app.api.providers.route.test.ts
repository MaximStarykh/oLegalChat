import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "u1" } } }),
    },
  }),
}))

vi.mock("@/lib/user-keys", () => ({
  getEffectiveApiKey: async () => "ENV_KEY",
}))

import { POST } from "@/app/api/providers/route"

describe("/api/providers", () => {
  it("returns hasUserKey=false when only env key is present", async () => {
    // Align env with the mocked effective API key value
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "ENV_KEY"
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ provider: "google", userId: "u1" }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.provider).toBe("google")
    expect(json.hasUserKey).toBe(false)
  })
})


