import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) },
    from: () => ({
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { favorite_models: ["gemini-1.5-flash-002"] }, error: null }) }) }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: { favorite_models: [] }, error: null }) }) }),
    }),
  }),
}))

import { POST, GET } from "@/app/api/user-preferences/favorite-models/route"

describe("/api/user-preferences/favorite-models", () => {
  it("POST validates array", async () => {
    const bad = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ favorite_models: "bad" }) }))
    expect(bad.status).toBe(400)
    const ok = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ favorite_models: ["m"] }) }))
    expect(ok.status).toBe(200)
  })

  it("GET returns list", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.favorite_models)).toBe(true)
  })
})


