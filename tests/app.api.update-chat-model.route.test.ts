import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => null,
}))

import { POST } from "@/app/api/update-chat-model/route"

describe("/api/update-chat-model", () => {
  it("400 on missing fields", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it("succeeds when supabase disabled", async () => {
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ chatId: "c1", model: "gemini-1.5-flash-002" }),
      })
    )
    expect(res.status).toBe(200)
  })
})


