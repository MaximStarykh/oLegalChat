import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ModelProvider } from "@/lib/model-store/provider"
import { UserPreferencesProvider, type UserPreferences } from "@/lib/user-preference-store/provider"
import { UserProvider } from "@/lib/user-store/provider"

export function TestProviders({
  children,
  initialPreferences,
}: {
  children: React.ReactNode
  initialPreferences?: Partial<UserPreferences>
}) {
  const qc = new QueryClient()
  const mergedPrefs: UserPreferences | undefined = initialPreferences
    ? ({
        layout: "fullscreen",
        promptSuggestions: true,
        showToolInvocations: true,
        showConversationPreviews: true,
        multiModelEnabled: false,
        showReasoning: false,
        hiddenModels: [],
        ...initialPreferences,
      } as UserPreferences)
    : undefined
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <UserProvider initialUser={null}>
          <ModelProvider>
            <UserPreferencesProvider
              userId={undefined}
              initialPreferences={mergedPrefs}
            >
              {children}
            </UserPreferencesProvider>
          </ModelProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}


