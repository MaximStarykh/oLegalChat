import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MessageAssistant } from "@/app/components/chat/message-assistant"
import { TestProviders } from "./utils/providers"
import type { UserPreferences } from "@/lib/user-preference-store/provider"

function renderWithPrefs(
  ui: React.ReactNode,
  prefs?: Partial<UserPreferences>
) {
  return render(<TestProviders initialPreferences={prefs}>{ui}</TestProviders>)
}

describe("MessageAssistant", () => {
  it("shows reasoning only when preference enabled", () => {
    // Seed localStorage since unauthenticated provider reads preferences from it
    window.localStorage.setItem(
      "user-preferences",
      JSON.stringify({
        layout: "fullscreen",
        promptSuggestions: true,
        showToolInvocations: true,
        showConversationPreviews: true,
        multiModelEnabled: false,
        showReasoning: true,
        hiddenModels: [],
      })
    )
    const parts: any = [{ type: "reasoning", reasoning: "Chain of thought" }]
    renderWithPrefs(
      <MessageAssistant messageId="m1" parts={parts} status="ready">
        Answer
      </MessageAssistant>,
      { showReasoning: true }
    )
    // Reasoning component label should be present
    expect(screen.getByText(/Reasoning/i)).toBeInTheDocument()
  })

  it("does not show reasoning when preference disabled", () => {
    window.localStorage.setItem(
      "user-preferences",
      JSON.stringify({
        layout: "fullscreen",
        promptSuggestions: true,
        showToolInvocations: true,
        showConversationPreviews: true,
        multiModelEnabled: false,
        showReasoning: false,
        hiddenModels: [],
      })
    )
    const parts: any = [{ type: "reasoning", reasoning: "Hidden" }]
    renderWithPrefs(
      <MessageAssistant messageId="m1" parts={parts} status="ready">
        Answer
      </MessageAssistant>,
      { showReasoning: false }
    )
    expect(screen.queryByText(/Hidden/i)).not.toBeInTheDocument()
  })

  it("shows 'Searching the web…' when webSearch tool call is active", () => {
    const parts: any = [
      { type: "tool-invocation", toolInvocation: { toolName: "webSearch", state: "call" } },
    ]
    renderWithPrefs(
      <MessageAssistant messageId="m1" parts={parts} status="streaming" children="" />,
      { showReasoning: false }
    )
    expect(screen.getByText(/Searching the web/i)).toBeInTheDocument()
  })
})


