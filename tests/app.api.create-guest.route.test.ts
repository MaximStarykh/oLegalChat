import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server-guest", () => ({
  createGuestServerClient: async () => null,
}))

import { POST } from "@/app/api/create-guest/route"

describe("/api/create-guest", () => {
  it("400 on missing userId", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it("returns guest user data when supabase disabled", async () => {
    const res = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ userId: "u-guest" }) })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user.id).toBe("u-guest")
    expect(json.user.anonymous).toBe(true)
  })
})


