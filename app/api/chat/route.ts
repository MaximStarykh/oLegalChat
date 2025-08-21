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

interface WebInfo {
  uri?: string
  url?: string
  title?: string
  site?: string
  snippet?: string
}

interface GroundingChunk {
  web?: WebInfo
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[]
}

// Helper function to extract real URLs from Google's grounding metadata
function extractRealSources(
  groundingMetadata: GroundingMetadata | undefined,
  responseText: string
) {
  if (!groundingMetadata?.groundingChunks) return []

  const sources: Array<{ title: string; url: string; snippet: string }> = []
  
  for (const chunk of groundingMetadata.groundingChunks) {
    if (!chunk?.web) continue
    
    const web = chunk.web
    let url = web.uri || web.url || ""
    let title = web.title || web.site || ""
    let snippet = web.snippet || ""
    
    // Skip if no URL or title
    if (!url || !title) continue
    
    // Handle Google redirect URLs - extract real URLs from response text
      if (url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect/')) {
        // Try to find real URLs in the response text that match the title
        const urlMatches = responseText.match(/https?:\/\/[^\s\)\]\}\.,]+/g) || []
        
        // Find URLs that match the domain from the title
        let realUrl = null
        
        // First, try to find URLs that match the title domain
        if (title) {
          const titleDomain = title.toLowerCase().replace(/[^a-z0-9.-]/g, '')
          realUrl = urlMatches.find(u => {
            try {
              const urlObj = new URL(u)
              return urlObj.hostname.toLowerCase().includes(titleDomain) ||
                     titleDomain.includes(urlObj.hostname.toLowerCase())
            } catch {
              return false
            }
          })
        }
        
        // If no domain match, try to find any valid non-Google URL
        if (!realUrl) {
          realUrl = urlMatches.find(u => {
            try {
              const urlObj = new URL(u)
              return !urlObj.hostname.includes('google.com') && 
                     !urlObj.hostname.includes('vertexai') &&
                     urlObj.hostname.includes('.')
            } catch {
              return false
            }
          })
        }
        
        // If still no match, try to construct from common Ukrainian domains
        if (!realUrl && title) {
          const commonDomains = [
            'zakon.rada.gov.ua', 'reyestr.court.gov.ua', 'ccu.gov.ua', 
            'kmu.gov.ua', 'rada.gov.ua', 'nbu.gov.ua', 'tax.gov.ua',
            'minjust.gov.ua', 'diia.gov.ua', 'novaposhta.ua', 'ukrposhta.ua',
            'wikipedia.org', 'ukrinform.ua', 'unian.ua', 'interfax.ua'
          ]
          
          for (const domain of commonDomains) {
            if (title.toLowerCase().includes(domain.replace(/[^a-z0-9.-]/g, ''))) {
              // Extract path from title if possible
              const pathMatch = title.match(/\/[^\s]+/)
              const path = pathMatch ? pathMatch[0] : ''
              realUrl = `https://${domain}${path}`
              break
            }
          }
        }
        
        if (realUrl) {
          url = realUrl
          // Extract snippet from response text around the URL mention
          if (!snippet) {
            const urlIndex = responseText.indexOf(realUrl)
            if (urlIndex !== -1) {
              const start = Math.max(0, urlIndex - 100)
              const end = Math.min(responseText.length, urlIndex + 100)
              snippet = responseText.slice(start, end).trim()
            }
          }
        } else {
          // Skip this source if we can't find a real URL
          continue
        }
      }
    
    // Clean up and improve title
    if (title) {
      // Keep domain for official sources
      if (!title.includes('gov.ua')) {
        if (title.includes('.')) {
          title = title.split('.')[0]
        }
      }
      
      // Clean up formatting but preserve Ukrainian characters
      title = title.charAt(0).toUpperCase() + title.slice(1)
      title = title.replace(/[^\wа-яА-ЯіІїЇєЄґҐ\s-]/g, '').trim()
      
      // Add source type indicator for better context
      if (url.includes('gov.ua')) {
        title = `[Офіційне] ${title}`
      } else if (url.includes('rada.gov.ua')) {
        title = `[Рада] ${title}`
      } else if (url.includes('kmu.gov.ua')) {
        title = `[КМУ] ${title}`
      } else if (url.includes('president.gov.ua')) {
        title = `[ОПУ] ${title}`
      }
    }
    
    // Validate final URL
    try {
      const urlObj = new URL(url)
      if (!urlObj.hostname || urlObj.hostname.includes('google.com') || urlObj.hostname.includes('vertexai')) {
        continue // Skip invalid or Google URLs
      }
    } catch {
      continue // Skip invalid URLs
    }
    
    sources.push({
      title: title || "Unknown Source",
      url: url,
      snippet: snippet,
    })
  }
  
  return sources
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

    const tools: ToolSet = {}
    if (enableSearch) {
      tools.webSearch = {
        description:
          "Search the web for current information. Use this tool to find recent news, articles, documents, and other web content. DO NOT restrict searches to specific sites unless explicitly requested by the user. Search broadly across all available sources.",
        parameters: z.object({
          query: z.string().min(3),
          maxResults: z.number().int().min(1).max(10).default(5).optional(),
        }),
        execute: async ({ query, maxResults = 5 }) => {
          const googleKey =
            process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.GEMINI_API_KEY
          try {
            if (googleKey) {
              // Use Google Generative AI with Search grounding
              const { GoogleGenerativeAI } = await import(
                "@google/generative-ai"
              )
              const ai = new GoogleGenerativeAI(googleKey)
              const modelInstance = ai.getGenerativeModel({
                model: model,
              })
              
              // Clean query - remove any site restrictions that might be added by system prompt
              const cleanQuery = query
                .replace(/\s*site:[^\s]+/g, '') // Remove site: restrictions
                .replace(/\s*OR\s*site:[^\s]+/g, '') // Remove OR site: restrictions
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .trim()
              
              
              const request = {
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Search for: ${cleanQuery}. Find comprehensive information from all available sources including news sites, official websites, forums, and other relevant web content. Do not limit to specific domains.`,
                      },
                    ],
                  },
                ],
                tools: [{ googleSearch: {} }],
              }
              const result = await modelInstance.generateContent(
                request as unknown as Parameters<
                  typeof modelInstance.generateContent
                >[0]
              )
              
              const response = await result.response
              const responseText = response.text()
              
              // Extract sources from grounding metadata
              const gm = (
                response as {
                  candidates?: Array<{ groundingMetadata?: GroundingMetadata }>
                }
              ).candidates?.[0]?.groundingMetadata
              const sources = extractRealSources(gm, responseText)
              
              // Return sources in the format expected by the AI SDK
              return {
                sources: sources.slice(0, maxResults || 5),
                summary: responseText
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
      }
    }

    const result = streamText({
      model: modelConfig.apiSdk(apiKey, { enableSearch }),
      system: effectiveSystemPrompt,
      messages: messages,
      tools,
      maxSteps: 10,
      onChunk: ({ chunk }) => {
        try {
          // High-signal logging to detect reasoning/tool events
          if ((chunk as any).type === "reasoning") {
            console.log("[chat:onChunk] reasoning:", (chunk as any).text || (chunk as any).reasoning || "")
          } else if ((chunk as any).type === "tool-call") {
            console.log("[chat:onChunk] tool-call:", JSON.stringify(chunk, null, 2))
          } else if ((chunk as any).type === "tool-result") {
            console.log("[chat:onChunk] tool-result:", JSON.stringify(chunk, null, 2))
          } else if ((chunk as any).type === "text-delta") {
            // Keep this lightweight to avoid noisy logs; show small preview
            const t = (chunk as any).textDelta || ""
            console.log("[chat:onChunk] text-delta:", t.slice(0, 60))
          } else {
            console.log("[chat:onChunk] other:", JSON.stringify(chunk, null, 2))
          }
        } catch (e) {
          console.log("[chat:onChunk] log error:", e)
        }
      },
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
