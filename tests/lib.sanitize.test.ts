import { describe, it, expect } from "vitest"
import { sanitizeUserInput } from "@/lib/sanitize"

describe("lib/sanitize", () => {
  it("strips script tags", () => {
    const dirty = "<div>ok</div><script>alert('x')</script>"
    const clean = sanitizeUserInput(dirty)
    expect(clean).not.toContain("<script>")
    expect(clean).toContain("<div>ok</div>")
  })
})


