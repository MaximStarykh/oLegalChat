import { describe, it, expect } from "vitest"
import { env, createEnvWithUserKeys } from "@/lib/openproviders/env"

describe("lib/openproviders/env (env-only keys)", () => {
  it("createEnvWithUserKeys returns env keys unchanged (BYOK disabled)", () => {
    const e = createEnvWithUserKeys()
    expect(e).toHaveProperty("GOOGLE_GENERATIVE_AI_API_KEY", env.GOOGLE_GENERATIVE_AI_API_KEY)
  })
})


