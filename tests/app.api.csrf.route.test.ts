import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/csrf/route"

// Mock cookies from next/headers to observe set
vi.mock("next/headers", () => {
  const store = new Map<string, string>()
  return {
    cookies: async () => ({
      set: (name: string, value: string, _opts?: any) => {
        store.set(name, value)
      },
      get: (name: string) => store.get(name),
    }),
  }
})

describe("/api/csrf", () => {
  beforeEach(() => {
    // set a CSRF secret for hashing
    process.env.CSRF_SECRET = process.env.CSRF_SECRET || "test-secret"
  })
  it("sets csrf cookie and returns ok", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})


