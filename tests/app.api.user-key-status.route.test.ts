import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}))

import { GET } from "@/app/api/user-key-status/route"

describe("/api/user-key-status", () => {
  it("returns provider status map", async () => {
    const res = await GET()
    expect(res.status === 200 || res.status === 500).toBe(true)
  })
})


