import { describe, it, expect } from "vitest"
import { POST, DELETE } from "@/app/api/user-keys/route"

describe("/api/user-keys (BYOK disabled)", () => {
  it("POST returns 403", async () => {
    const res = await POST()
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/disabled/i)
  })

  it("DELETE returns 403", async () => {
    const res = await DELETE()
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/disabled/i)
  })
})


