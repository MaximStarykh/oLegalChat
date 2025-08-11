import { afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => {
  cleanup()
})

// Mock window.fetch to handle relative URLs used by providers in tests
const originalFetch = globalThis.fetch
globalThis.fetch = (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input?.url
  if (typeof url === "string" && url.startsWith("/")) {
    const absoluteUrl = new URL(url, "http://localhost")
    // Stub common API endpoints used by providers during tests
    if (absoluteUrl.pathname === "/api/models") {
      return Promise.resolve(
        new Response(JSON.stringify({ models: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    }
    if (absoluteUrl.pathname === "/api/user-key-status") {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            openrouter: false,
            openai: false,
            mistral: false,
            google: false,
            perplexity: false,
            xai: false,
            anthropic: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    }
    if (absoluteUrl.pathname === "/api/user-preferences/favorite-models") {
      return Promise.resolve(
        new Response(JSON.stringify({ favorite_models: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    }
    if (absoluteUrl.pathname === "/api/user-preferences") {
      if ((init?.method || "GET").toUpperCase() === "PUT") {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            layout: "fullscreen",
            prompt_suggestions: true,
            show_tool_invocations: true,
            show_conversation_previews: true,
            multi_model_enabled: false,
            show_reasoning: false,
            hidden_models: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    }
    return originalFetch(absoluteUrl.toString(), init)
  }
  return originalFetch(input, init)
}

// Mock matchMedia for components using it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})


