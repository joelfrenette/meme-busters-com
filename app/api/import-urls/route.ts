import { type NextRequest, NextResponse } from "next/server"
import { analyzeMeme } from "@/app/actions/analyze-meme"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Bulk URL import API called")

    const body = await request.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: "No URLs provided" }, { status: 400 })
    }

    console.log(`[v0] Processing ${urls.length} URLs...`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const url of urls) {
      try {
        // Validate URL
        const urlObj = new URL(url)
        if (!urlObj.protocol.startsWith("http")) {
          results.failed++
          results.errors.push(`Invalid URL: ${url}`)
          continue
        }

        console.log(`[v0] Downloading image from: ${url}`)

        // Download the image
        const imageResponse = await fetch(url)
        if (!imageResponse.ok) {
          results.failed++
          results.errors.push(`Failed to download: ${url} (${imageResponse.status})`)
          continue
        }

        // Convert to base64
        const arrayBuffer = await imageResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"
        const dataUrl = `data:${mimeType};base64,${base64}`

        console.log(`[v0] Analyzing meme from: ${url}`)

        await analyzeMeme(dataUrl)
        results.success++
        console.log(`[v0] Successfully analyzed and saved meme from: ${url}`)
      } catch (error) {
        console.error(`[v0] Error processing ${url}:`, error)
        results.failed++
        results.errors.push(`Error processing ${url}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log(`[v0] Import complete: ${results.success} success, ${results.failed} failed`)

    revalidatePath("/gallery")
    revalidatePath("/")
    revalidatePath("/admin/fetch-memes")

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${results.success} meme(s). ${results.failed} failed.`,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in bulk URL import:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import URLs",
      },
      { status: 500 },
    )
  }
}
