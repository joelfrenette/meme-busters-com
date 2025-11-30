"use server"

import { callXAI, createTextContent, createImageContent, type XAIContentPart } from "@/lib/xai-client"
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

// Helper to extract JSON from response
function extractJSON(text: string): unknown {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim())
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error("No JSON found in response")
}

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

  console.log("[v0] Step 2: Starting meme analysis with Grok API...")

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
    `You are a center-right, unbiased meme analysis and fact-checking expert. Analyze this meme image and categorize it.`

  // Build the prompt with JSON format instructions
  let fullPrompt = `${promptText}

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "overallVerdict": "one of: factual, misleading, out_of_context, distorted, misinformation, lies, unverifiable, sarcasm, satire, humor, wholesome, dark_humor",
  "confidence": number between 0-100,
  "claims": [
    {
      "text": "the specific claim",
      "verdict": "same options as overallVerdict",
      "confidence": number between 0-100,
      "explanation": "brief explanation",
      "sources": [{"title": "source title", "url": "https://...", "publisher": "publisher name"}] or []
    }
  ]
}`

  if (additionalContext) {
    console.log("[v0] Including additional context from user feedback")
    fullPrompt += `

**IMPORTANT: Human Feedback Context**
A human reviewer has provided the following additional context:
${additionalContext}

Please take this human interpretation into account.`
  }

  const content: XAIContentPart[] = [createTextContent(fullPrompt), createImageContent(imageData)]

  try {
    const responseText = await callXAI([{ role: "user", content }], {
      model: "grok-2-vision-latest",
      maxTokens: 4000,
      temperature: 0.3,
    })

    console.log("[v0] Raw response:", responseText.substring(0, 500))

    const parsed = extractJSON(responseText)
    const validated = memeAnalysisSchema.parse(parsed)

    console.log("[v0] Analysis complete:", JSON.stringify(validated, null, 2))

    return validated
  } catch (error) {
    console.error("[v0] Schema validation error:", error)

    const err: any = new Error("AI response validation failed")
    err.details =
      "The AI model returned a response that doesn't match the expected format. This could be due to:\n• Invalid verdict category\n• Missing required fields\n• Malformed URLs in sources\n• Confidence values outside 0-100 range\n\nPlease try analyzing the meme again."
    throw err
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
        details: "The XAI_API_KEY or GROK_API_KEY environment variable is missing. Please contact the administrator.",
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
