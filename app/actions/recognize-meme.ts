"use server"

import { callXAI, createTextContent, createImageContent, type XAIContentPart } from "@/lib/xai-client"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Schema for meme recognition response
const memeRecognitionSchema = z.object({
  isMeme: z.boolean(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  characteristics: z.object({
    hasTextOverlay: z.boolean(),
    hasRecognizableTemplate: z.boolean(),
    hasHumorousIntent: z.boolean(),
    hasViralPatterns: z.boolean(),
    hasCulturalContext: z.boolean(),
  }),
  rejectionReasons: z.array(z.string()),
})

export type MemeRecognitionResult = z.infer<typeof memeRecognitionSchema>

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

export async function recognizeMeme(imageData: string): Promise<MemeRecognitionResult> {
  try {
    console.log("[v0] Starting meme recognition with Grok API...")

    // Fetch the meme recognition prompt from database
    const supabase = await createClient()
    const { data: promptData, error: promptError } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("name", "meme_recognition")
      .eq("is_active", true)
      .maybeSingle()

    if (promptError || !promptData) {
      console.warn("[v0] Failed to fetch meme recognition prompt from database, using fallback")
    }

    const promptText =
      promptData?.prompt_text ||
      `You are an expert at detecting whether an image is a meme or not. Analyze this image using a multi-layer classification system.`

    const content: XAIContentPart[] = [
      createTextContent(`${promptText}

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "isMeme": true or false,
  "confidence": number between 0-100,
  "reasoning": "your detailed explanation",
  "characteristics": {
    "hasTextOverlay": true or false,
    "hasRecognizableTemplate": true or false,
    "hasHumorousIntent": true or false,
    "hasViralPatterns": true or false,
    "hasCulturalContext": true or false
  },
  "rejectionReasons": ["reason1", "reason2"] or empty array if it IS a meme
}`),
      createImageContent(imageData),
    ]

    const responseText = await callXAI([{ role: "user", content }], {
      model: "grok-2-vision-latest",
      maxTokens: 1500,
      temperature: 0.2,
    })

    console.log("[v0] Raw Grok response:", responseText.substring(0, 500))

    // Parse and validate the response
    const parsed = extractJSON(responseText)
    const validated = memeRecognitionSchema.parse(parsed)

    console.log("[v0] Meme recognition complete:", {
      isMeme: validated.isMeme,
      confidence: validated.confidence,
      characteristics: validated.characteristics,
    })

    return validated
  } catch (error) {
    console.error("[v0] Error recognizing meme:", error)
    throw new Error(`Failed to recognize meme: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
