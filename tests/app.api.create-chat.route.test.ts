import { describe, it, expect, vi } from "vitest"
import * as api from "@/app/api/create-chat/api"
import { POST } from "@/app/api/create-chat/route"

describe("/api/create-chat", () => {
  it("400 on missing userId", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it("returns chat when created (or null supabase path)", async () => {
    vi.spyOn(api, "createChatInDb").mockResolvedValue({ id: "c1" } as any)
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ userId: "u1", title: "t", model: "m", isAuthenticated: false }),
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.chat.id).toBe("c1")
  })
})


