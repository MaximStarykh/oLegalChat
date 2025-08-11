import { describe, it, expect, vi } from "vitest"
import * as api from "@/app/api/rate-limits/api"
import { GET } from "@/app/api/rate-limits/route"

describe("/api/rate-limits", () => {
  it("400 on missing userId", async () => {
    const res = await GET(new Request("http://localhost/api/rate-limits"))
    expect(res.status).toBe(400)
  })

  it("returns usage payload when available", async () => {
    vi.spyOn(api, "getMessageUsage").mockResolvedValue({
      dailyCount: 1,
      dailyProCount: 0,
      dailyLimit: 5,
      remaining: 4,
      remainingPro: 500,
    })
    const res = await GET(
      new Request("http://localhost/api/rate-limits?userId=u1&isAuthenticated=false")
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.dailyCount).toBe(1)
  })

  it("returns friendly 200 message when null (no supabase)", async () => {
    vi.spyOn(api, "getMessageUsage").mockResolvedValue(null as any)
    const res = await GET(
      new Request("http://localhost/api/rate-limits?userId=u1&isAuthenticated=false")
    )
    expect(res.status).toBe(200)
  })
})


