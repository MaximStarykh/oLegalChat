import { NextRequest } from "next/server"
import { z } from "zod"

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

// Minimal Gemini API with Google Search grounding
export async function GET(req: NextRequest) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const ai = new GoogleGenerativeAI(apiKey)
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" })

    const { searchParams } = new URL(req.url)
    const querySchema = z.object({ q: z.string().min(1) })
    const parseResult = querySchema.safeParse({ q: searchParams.get("q") })
    if (!parseResult.success) {
      return Response.json({ error: "Invalid query" }, { status: 400 })
    }
    const { q } = parseResult.data

    // Enable Google Search grounding via tool config
    const request = {
      contents: [
        { role: "user", parts: [{ text: `Find and summarize: ${q}. Cite sources.` }] },
      ],
      tools: [{ googleSearch: {} }],
    }
    const result = await model.generateContent(
      request as unknown as Parameters<typeof model.generateContent>[0]
    )

    const response = await result.response
    const text = response.text()
    const gm = (
      response as {
        candidates?: Array<{ groundingMetadata?: GroundingMetadata }>
      }
    ).candidates?.[0]?.groundingMetadata
    const sources =
      gm?.groundingChunks?.map((c) => c.web).filter((w): w is WebInfo => Boolean(w)) ?? []

    return Response.json({ answer: text, sources })
  } catch (err) {
    console.error("/api/search error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}


