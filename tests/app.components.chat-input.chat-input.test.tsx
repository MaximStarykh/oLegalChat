import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChatInput } from "@/app/components/chat-input/chat-input"
import { TestProviders } from "./utils/providers"

const noop = () => {}

function renderInput(selectedModel = "gemini-1.5-flash-002", enableSearch = true) {
  return render(
    <TestProviders>
      <ChatInput
        value="hi"
        onValueChange={noop}
        onSend={noop}
        isSubmitting={false}
        files={[]}
        onFileUpload={noop as any}
        onFileRemove={noop as any}
        onSuggestion={noop}
        hasSuggestions={false}
        onSelectModel={noop as any}
        selectedModel={selectedModel}
        isUserAuthenticated={true}
        stop={noop}
        status="ready"
        setEnableSearch={noop as any}
        enableSearch={enableSearch}
      />
    </TestProviders>
  )
}

describe("ChatInput", () => {
  it("renders Reasoning toggle button", () => {
    renderInput()
    expect(screen.getByText(/Reasoning:/i)).toBeInTheDocument()
  })

  it("shows web search toggle when model supports webSearch", () => {
    renderInput("gemini-1.5-flash-002")
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument()
  })
})


