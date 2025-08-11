import { describe, it, expect } from "vitest"
import {
  checkUsageByModel,
} from "@/lib/usage"

function makeSupabase(overrides?: any) {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { daily_message_count: 0, daily_reset: new Date().toISOString(), anonymous: true, premium: false }, error: null }) }) }),
      update: () => ({ eq: () => ({}) }),
    }),
    ...overrides,
  } as any
}

describe("lib/usage", () => {
  it("allows free models for guests via checkUsageByModel", async () => {
    const supabase = makeSupabase()
    const result = await checkUsageByModel(supabase, "u1", "gemini-1.5-flash-002", false)
    expect(result).toBeTruthy()
  })
})


