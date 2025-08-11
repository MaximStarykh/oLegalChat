import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { code: "PGRST116" } }) }) }),
      upsert: () => ({ select: () => ({ single: async () => ({ data: { layout: "fullscreen", prompt_suggestions: true, show_tool_invocations: true, show_conversation_previews: true, multi_model_enabled: false, hidden_models: [] }, error: null }) }) }),
    }),
  }),
}))

import { GET, PUT } from "@/app/api/user-preferences/route"

describe("/api/user-preferences", () => {
  it("GET returns defaults when none exist", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.layout).toBe("fullscreen")
  })

  it("PUT updates preferences", async () => {
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ layout: "fullscreen" }),
    })
    const res = await PUT(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})


