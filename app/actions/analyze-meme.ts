"use server"

import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { recognizeMeme, type MemeRecognitionResult } from "./recognize-meme"

const memeAnalysisSchema = z.object({
  overallVerdict: z
    .enum([
      "factual",
      "misleading",
      "out_of_context",
      "distorted",
      "misinformation",
      "lies",
      "unverifiable",
      "sarcasm",
      "satire",
      "humor",
      "wholesome",
      "dark_humor",
    ])
    .describe("Overall verdict/category for the meme"),
  confidence: z.number().min(0).max(100).describe("Confidence level of the overall verdict"),
  claims: z
    .array(
      z.object({
        text: z.string().describe("The specific claim made in the meme"),
        verdict: z
          .enum([
            "factual",
            "misleading",
            "out_of_context",
            "distorted",
            "misinformation",
            "lies",
            "unverifiable",
            "sarcasm",
            "satire",
            "humor",
            "wholesome",
            "dark_humor",
          ])
          .describe("Verdict/category for this specific claim"),
        confidence: z.number().min(0).max(100).describe("Confidence level for this claim"),
        explanation: z.string().describe("Brief explanation of why this verdict was given"),
        sources: z
          .array(
            z.object({
              title: z.string().describe("Title of the source"),
              url: z.string().url().describe("Real, verifiable URL to the source"),
              publisher: z.string().describe("Publisher or organization name"),
            }),
          )
          .optional()
          .default([])
          .describe("Real, verifiable sources that support or refute this claim (optional for humor/satire)"),
      }),
    )
    .min(1)
    .describe("Individual claims found in the meme"),
})

export type MemeAnalysisResult = z.infer<typeof memeAnalysisSchema> & {
  id: string
  imageUrl: string
  analyzedAt: string
  recognition?: MemeRecognitionResult
}

export type AnalysisError = {
  success: false
  category:
    | "not_a_meme"
    | "api_key_missing"
    | "api_error"
    | "database_error"
    | "network_error"
    | "invalid_image"
    | "unknown"
  message: string
  details?: string
}

export type AnalysisSuccess = {
  success: true
  data: MemeAnalysisResult
}

export type AnalysisResponse = AnalysisSuccess | AnalysisError

export async function performAnalysis(
  imageData: string,
  additionalContext?: string,
): Promise<Omit<MemeAnalysisResult, "id" | "analyzedAt">> {
  console.log("[v0] Step 1: Running meme recognition...")
  const recognition = await recognizeMeme(imageData)

  if (recognition.confidence < 50) {
    console.log("[v0] Image rejected - not recognized as a meme")
    const error: any = new Error(`This doesn't appear to be a meme (${recognition.confidence}% confidence)`)
    error.details = `Reasons:\n${recognition.rejectionReasons.map((r) => `• ${r}`).join("\n")}\n\nExplanation: ${recognition.reasoning}`
    throw error
  }

  console.log(`[v0] Image recognized as meme with ${recognition.confidence}% confidence. Proceeding to analysis...`)

  console.log("[v0] Step 2: Starting meme analysis with OpenAI via Vercel AI Gateway...")

  const supabase = await createClient()
  const { data: promptData, error: promptError } = await supabase
    .from("prompts")
    .select("prompt_text")
    .eq("name", "meme_analysis")
    .eq("is_active", true)
    .single()

  if (promptError || !promptData) {
    console.warn("[v0] Failed to fetch prompt from database, using fallback")
  }

  const promptText =
    promptData?.prompt_text ||
    `You are a center-right, unbiased meme analysis and fact-checking expert. Analyze this meme image and categorize it using this taxonomy focused on TRUTHFULNESS and ACCURACY:

**Truthfulness & Accuracy Categories:**
- "factual" - Completely true and verifiable with credible sources
- "misleading" - True but missing important context or cherry-picked facts that create false impression
- "out_of_context" - True statement used in wrong context to imply something false
- "distorted" - Facts twisted, exaggerated, or misrepresented to support a narrative
- "misinformation" - False information (may not be intentionally deceptive)
- "lies" - Intentionally false and deceptive claims
- "unverifiable" - Claims that cannot be fact-checked with available credible sources

**Tone-Based Categories:**
- "sarcasm" - Says the opposite of what's meant to mock or criticize
- "satire" - Humor that ridicules people, politics, or society
- "humor" - Straightforward comedy without deeper meaning
- "wholesome" - Positive, heartwarming, or uplifting
- "dark_humor" - Funny but morbid, offensive, or tragic

**CRITICAL: Source Selection & Bias Guidelines**
When fact-checking claims, you MUST:

1. **PRIORITIZE UNBIASED NEWS SOURCES:**
   - Ground News (https://ground.news/) - Shows multiple perspectives
   - AllSides (https://www.allsides.com/unbiased-balanced-news) - Balanced coverage
   - The Free Press (https://www.thefp.com/) - Independent journalism
   - 1440 Daily Digest (https://join1440.com/) - Unbiased news
   - We Defend Truth (https://www.wedefendtruth.org/) - Truth-focused

2. **USE FACT-CHECKING SITES:**
   - Debunk.org (https://www.debunk.org/)
   - FactCheck.org (https://www.factcheck.org/fake-news/)
   - Snopes (https://www.snopes.com/)
   - PolitiFact (https://www.politifact.com/)
   - Reuters Fact Check
   - Know Your Meme (https://knowyourmeme.com/)
   - Washington Post Fact Checker (https://www.washingtonpost.com/politics/fact-checker/)
   - Retraction Watch (https://retractionwatch.com/)

3. **AVOID MAINSTREAM MEDIA BIAS:**
   - DO NOT rely primarily on legacy/mainstream media (CNN, MSNBC, NYT, WaPo) as they are known for left-leaning bias and partisan narratives
   - If using mainstream sources, balance with independent and center-right perspectives
   - Question narratives that align with Democratic/progressive talking points
   - Be skeptical of sources that blindly support left-wing agendas

4. **MAINTAIN CENTER-RIGHT PERSPECTIVE:**
   - Approach fact-checking from a center-unbiased or slightly right-leaning viewpoint
   - Avoid "woke" or progressive framing
   - Challenge liberal narratives and Democratic socialist agendas
   - Recognize media double standards and hypocrisy

5. **SOURCE DIVERSITY:**
   - When claims are politically charged, include perspectives from independent journalists and alternative media
   - Prioritize primary sources, official documents, and data over media interpretation
   - Include right-leaning sources when relevant (Daily Wire, Federalist, National Review)

**IMPORTANT: Sources are OPTIONAL for humor/satire/sarcasm**
- For factual claims, you MUST provide credible sources
- For humor, satire, sarcasm, or dark_humor, sources are optional (you can provide an empty sources array)
- Only provide sources when they add value to the analysis

**FOCUS ON TRUTHFULNESS:**
Your primary goal is to determine if claims are TRUE or FALSE, not to identify political messaging.
- A political meme can be "factual" if its claims are true, even if it promotes a party
- A political meme is "misleading" if it cherry-picks facts or omits context
- A political meme is "lies" if it makes demonstrably false claims
- Only use "unverifiable" if you genuinely cannot find credible sources to verify the claim

Be thorough, maintain a center-right perspective, and provide detailed explanations. Use real URLs from credible, unbiased sources when available.`

  const messageContent: any[] = [
    {
      type: "text",
      text: promptText,
    },
  ]

  // Add user feedback context if provided
  if (additionalContext) {
    console.log("[v0] Including additional context from user feedback")
    messageContent.push({
      type: "text",
      text: `\n\n**IMPORTANT: Human Feedback Context**\n\nA human reviewer has provided the following additional context that you should incorporate into your analysis:\n\n${additionalContext}\n\nPlease take this human interpretation into account, especially regarding cultural, historical, or contextual meanings that may not be immediately apparent from the image alone. The human perspective is valuable for understanding nuances that AI might miss.`,
    })
  }

  messageContent.push({
    type: "image",
    image: imageData,
  })

  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o",
      schema: memeAnalysisSchema,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
      maxTokens: 4000,
      temperature: 0.3,
    })

    console.log("[v0] Analysis complete:", JSON.stringify(object, null, 2))

    return object
  } catch (schemaError) {
    console.error("[v0] Schema validation error:", schemaError)
    console.error("[v0] This usually means the AI returned a response that doesn't match the expected format")

    const error: any = new Error("AI response validation failed")
    error.details =
      "The AI model returned a response that doesn't match the expected format. This could be due to:\n• Invalid verdict category\n• Missing required fields\n• Malformed URLs in sources\n• Confidence values outside 0-100 range\n\nPlease try analyzing the meme again."
    throw error
  }
}

export async function analyzeMeme(imageData: string, additionalContext?: string): Promise<AnalysisResponse> {
  try {
    // Perform the analysis
    const analysisResult = await performAnalysis(imageData, additionalContext)

    const supabase = await createClient()

    // Store the verdict in uppercase to match filter expectations
    const verdictToStore = analysisResult.overallVerdict.toUpperCase()
    console.log("[v0] Storing verdict:", verdictToStore)

    try {
      const { data: savedMeme, error: dbError } = await supabase
        .from("meme_analyses")
        .insert({
          image_url: imageData,
          verdict: verdictToStore,
          overall_explanation: analysisResult.claims.map((c) => c.explanation).join(" "),
          claims: analysisResult.claims,
          sources: analysisResult.claims.flatMap((c) => c.sources),
        })
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Error saving to database:", dbError)

        if (dbError.code === "23514") {
          return {
            success: false,
            category: "database_error",
            message: "Database schema outdated",
            details: `The database needs to be updated to support the verdict "${analysisResult.overallVerdict}". Please run the latest migration script or contact the administrator.`,
          }
        }

        if (dbError.code === "23505") {
          return {
            success: false,
            category: "database_error",
            message: "Duplicate meme detected",
            details: "This meme has already been analyzed. Check the gallery to view existing results.",
          }
        }

        return {
          success: false,
          category: "database_error",
          message: "Failed to save analysis",
          details: `Database error: ${dbError.message}. Please try again or contact support if the issue persists.`,
        }
      }

      console.log("[v0] Saved to database with ID:", savedMeme.id)

      revalidatePath("/gallery")
      revalidatePath("/")
      console.log("[v0] Revalidated gallery and home pages")

      const result: MemeAnalysisResult = {
        ...analysisResult,
        id: savedMeme.id,
        imageUrl: imageData,
        analyzedAt: savedMeme.analyzed_at,
      }

      return {
        success: true,
        data: result,
      }
    } catch (dbError) {
      return {
        success: false,
        category: "database_error",
        message: "Database error",
        details: dbError instanceof Error ? dbError.message : "Failed to save analysis to database",
      }
    }
  } catch (error) {
    console.error("[v0] Error analyzing meme:", error)

    // Handle recognition errors
    if (error instanceof Error && error.message.includes("not recognized as a meme")) {
      return {
        success: false,
        category: "not_a_meme",
        message: error.message,
        details: (error as any).details,
      }
    }

    // Handle API key errors
    if (error instanceof Error && error.message.includes("not configured")) {
      return {
        success: false,
        category: "api_key_missing",
        message: "AI service is not configured",
        details:
          "The XAI_API_KEY or GROK_XAI_API_KEY environment variable is missing. Please contact the administrator.",
      }
    }

    // Handle rate limit errors
    if (error instanceof Error && (error.message.includes("rate limit") || error.message.includes("429"))) {
      return {
        success: false,
        category: "api_error",
        message: "Rate limit exceeded",
        details: "Too many requests. Please wait a moment and try again.",
      }
    }

    // Handle invalid image errors
    if (error instanceof Error && (error.message.includes("invalid") || error.message.includes("400"))) {
      return {
        success: false,
        category: "invalid_image",
        message: "Invalid image format",
        details: "The image format is not supported or the image is corrupted. Please try a different image.",
      }
    }

    // Handle network errors
    if (error instanceof Error && (error.message.includes("network") || error.message.includes("ECONNREFUSED"))) {
      return {
        success: false,
        category: "network_error",
        message: "Network error",
        details: "Unable to connect to the AI service. Please check your internet connection and try again.",
      }
    }

    // Generic error
    return {
      success: false,
      category: "unknown",
      message: "Analysis failed",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
