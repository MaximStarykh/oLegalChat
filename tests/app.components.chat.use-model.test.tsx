import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { useModel } from "@/app/components/chat/use-model"
import { MODEL_DEFAULT } from "@/lib/config"
import type { UserProfile } from "@/lib/user/types"

function TestComponent({ user }: { user: UserProfile | null }) {
  const { selectedModel } = useModel({
    currentChat: null,
    user,
    chatId: null,
  })
  return <div data-testid="model">{selectedModel}</div>
}

describe("useModel", () => {
  it("falls back to default when user's favorite model is unavailable", () => {
    const user = {
      id: "u1",
      favorite_models: ["non-existent-model"],
    } as unknown as UserProfile

    render(<TestComponent user={user} />)
    expect(screen.getByTestId("model").textContent).toBe(MODEL_DEFAULT)
  })
})
