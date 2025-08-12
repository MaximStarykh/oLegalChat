import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { Attachment } from "@ai-sdk/ui-utils"
import { Message as MessageAISDK, streamText, ToolSet } from "ai"
import { z } from "zod"
import {
  incrementMessageCount,
  logUserMessage,
  storeAssistantMessage,
  validateAndTrackUsage,
} from "./api"
import { createErrorResponse, extractErrorMessage } from "./utils"

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  enableSearch: boolean
  message_group_id?: string
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      enableSearch,
      message_group_id,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    // Increment message count for successful validation
    if (supabase) {
      await incrementMessageCount({ supabase, userId })
    }

    const userMessage = messages[messages.length - 1]

    if (supabase && userMessage?.role === "user") {
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: userMessage.content,
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
        message_group_id,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT

    // Always use env key (BYOK disabled)
    let apiKey: string | undefined
    {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(null, provider as ProviderWithoutOllama)) ||
        undefined
    }

    const tools: ToolSet = enableSearch
      ? {
          webSearch: {
            description:
              "Search the web for current legal information, recent laws, court decisions, and up-to-date legislation in Ukraine. Use this tool whenever you need to find the most recent and accurate information about laws, regulations, or legal developments. Always search before providing legal advice to ensure accuracy.",
            parameters: z.object({
              query: z.string().min(3),
              maxResults: z.number().int().min(1).max(5).default(3).optional(),
            }),
            execute: async ({ query, maxResults = 3 }) => {
              const googleKey =
                process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
                process.env.GEMINI_API_KEY
              try {
                if (googleKey) {
                  // Prefer Google Generative AI with Search grounding (no extra APIs)
                  const { GoogleGenerativeAI } = await import(
                    "@google/generative-ai"
                  )
                  const ai = new GoogleGenerativeAI(googleKey)
                  const model = ai.getGenerativeModel({
                    model: "gemini-2.5-flash",
                  })
                  const result = await model.generateContent({
                    contents: [
                      {
                        role: "user",
                        parts: [
                          {
                            text: `Find and summarize: ${query}. Cite sources.`,
                          },
                        ],
                      },
                    ],
                    tools: [{ googleSearch: {} }],
                  } as any)
                  const response = await result.response
                  // Extract sources from grounding metadata if present
                  const gm: any = (response as any).candidates?.[0]?.groundingMetadata
                  const sources =
                    gm?.groundingChunks
                      ?.map((c: any) => c?.web)
                      .filter((w: any) => w && (w.uri || w.url)) || []
                  
                  // Process sources to extract real URLs and clean up data
                  const processedSources = sources.map((w: any) => {
                    let url = w.uri || w.url || ""
                    let title = w.title || w.site || ""
                    
                                         // Extract real URL from Google's grounding redirect if present
                     if (url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect/')) {
                       // Try to extract the original URL from the response text
                       const responseText = response.text()
                       const urlMatch = responseText.match(/https?:\/\/[^\s]+/g)
                       if (urlMatch && urlMatch.length > 0) {
                         // Find a URL that matches the domain from the title
                         const domainMatch = urlMatch.find(u => {
                           if (!title) return false
                           const domain = title.toLowerCase()
                           return u.toLowerCase().includes(domain.replace(/[^a-z0-9.-]/g, ''))
                         })
                         if (domainMatch) {
                           url = domainMatch
                         } else {
                           // If no domain match, try to find any valid URL that's not a Google redirect
                           const validUrl = urlMatch.find(u => 
                             !u.includes('google.com') && 
                             !u.includes('vertexai') &&
                             u.includes('http')
                           )
                           if (validUrl) {
                             url = validUrl
                           }
                         }
                       }
                     }
                     
                     // Additional fallback: if we still have a Google redirect URL, try to construct a real URL from the title
                     if (url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect/') && title) {
                       // Try to construct a real URL from common domains
                       const commonDomains = [
                         'zakon.rada.gov.ua', 'reyestr.court.gov.ua', 'ccu.gov.ua', 
                         'kmu.gov.ua', 'rada.gov.ua', 'nbu.gov.ua', 'tax.gov.ua',
                         'minjust.gov.ua', 'diia.gov.ua', 'novaposhta.ua', 'ukrposhta.ua'
                       ]
                       
                       for (const domain of commonDomains) {
                         if (title.toLowerCase().includes(domain.replace(/[^a-z0-9.-]/g, ''))) {
                           url = `https://${domain}`
                           break
                         }
                       }
                     }
                    
                    // Clean up title (remove domain suffixes)
                    if (title && title.includes('.')) {
                      title = title.split('.')[0]
                      title = title.charAt(0).toUpperCase() + title.slice(1)
                    }
                    
                    return {
                      title: title || "Unknown Source",
                      url: url,
                      snippet: w.snippet || "",
                    }
                  }).filter((s: any) => s.url && s.url !== "")
                  
                  // Return sources in the format expected by the AI SDK
                  return {
                    sources: processedSources
                  }
                }
                return {
                  sources: [
                    {
                      title: "Search unavailable: configure GOOGLE_GENERATIVE_AI_API_KEY",
                      url: "",
                      snippet: "",
                    },
                  ]
                }
              } catch (err) {
                console.error("webSearch tool failed:", err)
                return {
                  sources: [
                    { title: "Search failed", url: "", snippet: "" },
                  ]
                }
              }
            },
          },
        }
      : ({} as ToolSet)

    const result = streamText({
      model: modelConfig.apiSdk(apiKey, { enableSearch }),
      system: effectiveSystemPrompt,
      messages: messages,
      tools,
      maxSteps: 10,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err)
        // Don't set streamError anymore - let the AI SDK handle it through the stream
      },

      onFinish: async ({ response }) => {
        if (supabase) {
          await storeAssistantMessage({
            supabase,
            chatId,
            messages:
              response.messages as unknown as import("@/app/types/api.types").Message[],
            message_group_id,
          })
        }
      },
    })

    return result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
      getErrorMessage: (error: unknown) => {
        console.error("Error forwarded to client:", error)
        return extractErrorMessage(error)
      },
    })
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
