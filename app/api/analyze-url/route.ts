import { type NextRequest, NextResponse } from "next/server"
import { analyzeMeme, performAnalysis } from "@/app/actions/analyze-meme"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, memeId } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    console.log(
      "[v0] API: Analyzing meme from URL:",
      imageUrl,
      memeId ? `(updating existing: ${memeId})` : "(creating new)",
    )

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString("base64")

    // Detect content type from response or default to jpeg
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const dataUrl = `data:${contentType};base64,${base64}`

    console.log("[v0] API: Converted image to data URL, size:", base64.length, "bytes")

    if (memeId) {
      // Re-analyze existing meme (UPDATE)
      const supabase = await createClient()

      // Verify meme exists
      const { data: existingMeme, error: fetchError } = await supabase
        .from("meme_analyses")
        .select("*")
        .eq("id", memeId)
        .single()

      if (fetchError || !existingMeme) {
        console.error("[v0] API: Meme not found:", memeId)
        return NextResponse.json({ error: "Meme not found" }, { status: 404 })
      }

      console.log("[v0] API: Re-analyzing existing meme:", memeId)
      const result = await performAnalysis(dataUrl)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 },
        )
      }

      // Update existing meme
      const { error: updateError } = await supabase
        .from("meme_analyses")
        .update({
          verdict: result.data.overallVerdict.toUpperCase(),
          claims: result.data.claims,
          overall_explanation: result.data.claims.map((c) => c.explanation).join(" "),
          sources: result.data.claims.flatMap((c) => c.sources),
          updated_at: new Date().toISOString(),
        })
        .eq("id", memeId)

      if (updateError) {
        console.error("[v0] API: Error updating meme:", updateError)
        return NextResponse.json({ error: "Failed to update analysis" }, { status: 500 })
      }

      console.log("[v0] API: Re-analysis complete (updated existing meme, no duplicate created):", memeId)

      return NextResponse.json({
        success: true,
        analysisId: memeId,
        result: { ...result.data, id: memeId },
      })
    } else {
      // Create new meme (INSERT)
      const result = await analyzeMeme(dataUrl)

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 },
        )
      }

      console.log("[v0] API: Analysis successful, created new meme with ID:", result.data.id)

      return NextResponse.json({
        success: true,
        analysisId: result.data.id,
        result: result.data,
      })
    }
  } catch (error) {
    console.error("[v0] API: Error analyzing meme:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze meme",
      },
      { status: 500 },
    )
  }
}
