import { NextRequest } from "next/server"

// Minimal Gemini API with Google Search grounding
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const ai = new GoogleGenerativeAI(apiKey)
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" })

    const q = new URL(req.url).searchParams.get("q") ?? "Top AI news this week"

    // Enable Google Search grounding via tool config
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Find and summarize: ${q}. Cite sources.` }] }],
      tools: [{ googleSearch: {} }],
    } as any)

    const response = await result.response
    const text = response.text()
    const gm: any = (response as any).candidates?.[0]?.groundingMetadata
    const sources = gm?.groundingChunks?.map((c: any) => c.web).filter(Boolean) ?? []

    return Response.json({ answer: text, sources })
  } catch (err) {
    console.error("/api/search error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}


