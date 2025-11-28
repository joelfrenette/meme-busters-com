"use server"

import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Schema for meme recognition response
const memeRecognitionSchema = z.object({
  isMeme: z.boolean().describe("Whether the image is classified as a meme"),
  confidence: z.number().min(0).max(100).describe("Confidence level (0-100) that this is a meme"),
  reasoning: z.string().describe("Detailed explanation of why this is or isn't a meme"),
  characteristics: z.object({
    hasTextOverlay: z.boolean().describe("Does the image have text overlaid on it?"),
    hasRecognizableTemplate: z.boolean().describe("Is this a recognizable meme template or format?"),
    hasHumorousIntent: z.boolean().describe("Does the content appear to have humorous or satirical intent?"),
    hasViralPatterns: z.boolean().describe("Does it show signs of viral sharing (compression, watermarks, etc.)?"),
    hasCulturalContext: z.boolean().describe("Does it reference internet culture or meme conventions?"),
  }),
  rejectionReasons: z
    .array(z.string())
    .describe(
      "If not a meme, list specific reasons (e.g., 'No text overlay detected', 'Appears to be original photography')",
    ),
})

export type MemeRecognitionResult = z.infer<typeof memeRecognitionSchema>

export async function recognizeMeme(imageData: string): Promise<MemeRecognitionResult> {
  try {
    console.log("[v0] Starting meme recognition with OpenAI via Vercel AI Gateway...")

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
      `You are an expert at detecting whether an image is a meme or not. Analyze this image using a multi-layer classification system:

**Layer 1: Visual Structure Detection**
- Text overlay (especially top/bottom format, Impact font, white text with black outline)
- Recognizable meme template formats (Drake, Distracted Boyfriend, Expanding Brain, etc.)
- Consistent visual patterns common to memes
- Aspect ratios typical of memes (square, landscape)
- Low-resolution or deliberately pixelated quality

**Layer 2: Cultural Context Analysis**
- Pop culture references or internet culture elements
- Meme-specific language patterns ("When you...", "Me:", "Nobody:", "POV:")
- Internet slang and abbreviations
- Relatable situations expressed comedically

**Layer 3: Viral Pattern Recognition**
- Image compression artifacts from repeated sharing
- Watermarks from meme generators (imgflip, mematic, etc.)
- Signs of being screenshot or re-shared multiple times

**Layer 4: Content Semantics**
- Humor, irony, or sarcasm in text-image relationship
- Juxtaposition between image and text creating comedic meaning
- Relatable emotions or situations
- Satirical or parodic intent

**Confidence Scoring:**
- High confidence (80-100): Clear meme with multiple indicators
- Medium confidence (50-79): Likely a meme but missing some typical characteristics
- Low confidence (0-49): Not a meme - appears to be regular image, infographic, photo, etc.

**When NOT a meme, provide specific rejection reasons:**
- "No text overlay detected"
- "Appears to be original photography without meme context"
- "No recognizable meme format or template"
- "Content appears serious/informational rather than humorous"
- "Looks like an infographic or educational content"
- "Professional photo or stock image"
- "Screenshot of text/article without meme characteristics"`

    const { object } = await generateObject({
      model: "openai/gpt-4o",
      schema: memeRecognitionSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image",
              image: imageData,
            },
          ],
        },
      ],
      maxTokens: 1500,
      temperature: 0.2, // Lower temperature for more consistent classification
    })

    console.log("[v0] Meme recognition complete:", {
      isMeme: object.isMeme,
      confidence: object.confidence,
      characteristics: object.characteristics,
    })

    return object
  } catch (error) {
    console.error("[v0] Error recognizing meme:", error)
    throw new Error(`Failed to recognize meme: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
