import { describe, it, expect, beforeEach } from "vitest"
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf"

describe("lib/csrf", () => {
  beforeEach(() => {
    process.env.CSRF_SECRET = process.env.CSRF_SECRET || "test-secret"
  })

  it("generates and validates token", () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token)).toBe(true)
  })
})


