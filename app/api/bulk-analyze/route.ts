import { type NextRequest, NextResponse } from "next/server"
import { analyzeMeme } from "@/app/actions/analyze-meme"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { memes } = await request.json()

    if (!Array.isArray(memes) || memes.length === 0) {
      return NextResponse.json({ error: "Invalid request: memes array required" }, { status: 400 })
    }

    console.log(`[v0] Starting bulk analysis of ${memes.length} memes...`)

    const results = []
    const errors = []

    for (let i = 0; i < memes.length; i++) {
      const meme = memes[i]
      console.log(`[v0] Analyzing meme ${i + 1}/${memes.length}: ${meme.image_url}`)

      try {
        // Create a FormData object with the image URL
        const formData = new FormData()

        // Fetch the image and convert to blob
        const imageResponse = await fetch(meme.image_url)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
        }

        const imageBlob = await imageResponse.blob()
        const file = new File([imageBlob], "meme.jpg", { type: imageBlob.type })
        formData.append("image", file)

        // Analyze the meme
        const result = await analyzeMeme(formData)

        if (result.success) {
          results.push({
            ...result,
            source_article: meme.source_article,
            source_site: meme.source_site,
            original_url: meme.image_url,
          })
          console.log(`[v0] ✓ Successfully analyzed meme ${i + 1}`)
        } else {
          errors.push({
            meme,
            error: result.error,
          })
          console.log(`[v0] ✗ Failed to analyze meme ${i + 1}: ${result.error}`)
        }

        // Rate limiting - wait between requests
        if (i < memes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000)) // 3 second delay
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push({
          meme,
          error: errorMessage,
        })
        console.log(`[v0] ✗ Error analyzing meme ${i + 1}: ${errorMessage}`)
      }
    }

    console.log(`[v0] Bulk analysis complete: ${results.length} successful, ${errors.length} failed`)

    return NextResponse.json({
      success: true,
      analyzed: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error("[v0] Bulk analysis error:", error)
    return NextResponse.json(
      {
        error: "Failed to process bulk analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
