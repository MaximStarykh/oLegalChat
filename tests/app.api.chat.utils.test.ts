import { describe, it, expect } from "vitest"
import {
  cleanMessagesForTools,
  messageHasToolContent,
  extractErrorMessage,
  createErrorResponse,
} from "@/app/api/chat/utils"

describe("chat utils", () => {
  it("messageHasToolContent detects tool invocations", () => {
    const msg: any = {
      role: "assistant",
      content: [],
      toolInvocations: [{ name: "webSearch" }],
    }
    expect(messageHasToolContent(msg)).toBe(true)
  })

  it("cleanMessagesForTools removes tool parts when hasTools=false", () => {
    const msgs: any = [
      {
        role: "assistant",
        content: [
          { type: "text", text: "hello" },
          { type: "tool-invocation" },
          { type: "tool-result" },
        ],
      },
      { role: "tool", content: "..." },
    ]
    const cleaned = cleanMessagesForTools(msgs, false)
    expect(cleaned.length).toBe(1)
    expect(typeof cleaned[0].content === "string").toBe(true)
  })

  it("extractErrorMessage maps auth and rate limit errors", () => {
    expect(extractErrorMessage(new Error("authentication_error"))).toMatch(/Invalid API key/i)
    expect(extractErrorMessage(new Error("rate limit"))).toMatch(/Rate limit/i)
  })

  it("createErrorResponse returns 403 for DAILY_LIMIT_REACHED", async () => {
    const res = createErrorResponse({ code: "DAILY_LIMIT_REACHED", message: "limit" })
    expect(res.status).toBe(403)
  })
})


