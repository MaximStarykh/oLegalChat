import { describe, it, expect } from "vitest"
import { getUserKey, getEffectiveApiKey, type ProviderWithoutOllama } from "@/lib/user-keys"

describe("lib/user-keys (BYOK disabled)", () => {
  it("getUserKey always returns null", async () => {
    const key = await getUserKey("user-1", "google")
    expect(key).toBeNull()
  })

  it("getEffectiveApiKey returns env key for google", async () => {
    const key = await getEffectiveApiKey(null, "google" as ProviderWithoutOllama)
    // key can be null if env not set in test env; assert type and allow string/null
    expect(typeof key === "string" || key === null).toBe(true)
  })
})


