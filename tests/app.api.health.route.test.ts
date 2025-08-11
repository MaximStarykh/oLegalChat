import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/health/route"

describe("/api/health", () => {
  it("returns ok status", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("ok")
    expect(typeof json.timestamp).toBe("string")
    expect(typeof json.uptime).toBe("number")
  })
})


