import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChatInput } from "@/app/components/chat-input/chat-input"
import { TestProviders } from "./utils/providers"

const noop = () => {}

function renderInput(selectedModel = "gemini-2.5-flash", enableSearch = true) {
  return render(
    <TestProviders>
      <ChatInput
        value="hi"
        onValueChange={noop}
        onSend={noop}
        isSubmitting={false}
        files={[]}
        onFileUpload={noop as unknown as (files: File[]) => void}
        onFileRemove={noop as unknown as (file: File) => void}
        onSuggestion={noop}
        hasSuggestions={false}
        onSelectModel={noop as unknown as (m: string) => void}
        selectedModel={selectedModel}
        isUserAuthenticated={true}
        stop={noop}
        status="ready"
        setEnableSearch={noop as unknown as (e: boolean) => void}
        enableSearch={enableSearch}
      />
    </TestProviders>
  )
}

describe("ChatInput", () => {
  it("renders Think toggle button", () => {
    renderInput()
    expect(screen.getByText(/Think:/i)).toBeInTheDocument()
  })

  it("shows web search toggle when model supports webSearch", () => {
    renderInput("gemini-2.5-flash")
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument()
  })
})


