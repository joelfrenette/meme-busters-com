import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchRedditMemesSimple } from "@/lib/api/reddit-simple"

const MEME_SUBREDDITS = [
  "PoliticalMemes",
  "PoliticalHumor",
  "TheRightCantMeme",
  "TheLeftCantMeme",
  "AdviceAnimals",
  "memes",
  "dankleft",
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Simple fetch memes API called")

    const body = await request.json()
    const { quickFill } = body

    if (!quickFill) {
      return NextResponse.json({ success: false, error: "Only quick fill is supported" }, { status: 400 })
    }

    console.log("[v0] Starting quick fill from Reddit...")

    // Fetch from all subreddits
    const allMemes: any[] = []

    for (const subreddit of MEME_SUBREDDITS) {
      console.log(`[v0] Fetching from r/${subreddit}...`)
      const memes = await fetchRedditMemesSimple(subreddit, 15)
      console.log(`[v0] Got ${memes.length} memes from r/${subreddit}`)
      allMemes.push(...memes)

      await delay(1000)
    }

    console.log(`[v0] Total memes fetched: ${allMemes.length}`)

    // Sort by score (popularity)
    allMemes.sort((a, b) => b.score - a.score)

    // Take top 50
    const topMemes = allMemes.slice(0, 50)

    console.log(`[v0] Saving top ${topMemes.length} memes to database...`)

    // Save to database
    const supabase = createAdminClient()
    let savedCount = 0

    for (const meme of topMemes) {
      try {
        // Check if already exists
        const { data: existing } = await supabase.from("meme_analyses").select("id").eq("image_url", meme.url).single()

        if (existing) {
          console.log(`[v0] Skipping duplicate: ${meme.title}`)
          continue
        }

        // Save to database
        const { error } = await supabase.from("meme_analyses").insert({
          image_url: meme.url,
          title: meme.title,
          description: `From r/${meme.subreddit} - Score: ${meme.score}`,
          source_url: meme.permalink,
          rating: "unknown",
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error(`[v0] Error saving meme:`, error)
        } else {
          savedCount++
          console.log(`[v0] Saved: ${meme.title}`)
        }
      } catch (error) {
        console.error(`[v0] Error processing meme:`, error)
      }
    }

    console.log(`[v0] Successfully saved ${savedCount} memes`)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved ${savedCount} memes from Reddit`,
      count: savedCount,
    })
  } catch (error) {
    console.error("[v0] Fatal error in fetch-memes-simple:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
