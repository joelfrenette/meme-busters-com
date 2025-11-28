import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchRedditMemesOAuth } from "@/lib/api/reddit-oauth"

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

export async function POST() {
  try {
    console.log("[v0] Quick Fill API called")

    // Fetch from all subreddits
    const allMemes: any[] = []

    for (const subreddit of MEME_SUBREDDITS) {
      try {
        const memes = await fetchRedditMemesOAuth(subreddit, 15)
        console.log(`[v0] Got ${memes.length} memes from r/${subreddit}`)
        allMemes.push(...memes)

        // Delay between requests to avoid rate limiting
        await delay(1000)
      } catch (error) {
        console.error(`[v0] Error fetching r/${subreddit}:`, error)
        // Continue with other subreddits
      }
    }

    console.log(`[v0] Total memes fetched: ${allMemes.length}`)

    if (allMemes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No memes found. Please check Reddit API credentials.",
        },
        { status: 500 },
      )
    }

    // Sort by score (popularity)
    allMemes.sort((a, b) => b.score - a.score)

    // Take top 99
    const topMemes = allMemes.slice(0, 99)

    console.log(`[v0] Saving top ${topMemes.length} memes to database...`)

    // Save to database
    const supabase = createAdminClient()
    let savedCount = 0
    let skippedCount = 0

    for (const meme of topMemes) {
      try {
        // Check if already exists
        const { data: existing } = await supabase.from("meme_analyses").select("id").eq("image_url", meme.url).single()

        if (existing) {
          skippedCount++
          continue
        }

        // Save to database (without analysis for now - just the image)
        const { error } = await supabase.from("meme_analyses").insert({
          image_url: meme.url,
          title: meme.title,
          description: `From r/${meme.subreddit} - Score: ${meme.score}`,
          source_url: meme.permalink,
          rating: "unknown",
          verdict: "pending",
          confidence: 0,
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error(`[v0] Error saving meme:`, error)
        } else {
          savedCount++
        }
      } catch (error) {
        console.error(`[v0] Error processing meme:`, error)
      }
    }

    console.log(`[v0] Successfully saved ${savedCount} new memes (skipped ${skippedCount} duplicates)`)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved ${savedCount} new memes from Reddit (skipped ${skippedCount} duplicates)`,
      count: savedCount,
      skipped: skippedCount,
      total: allMemes.length,
    })
  } catch (error) {
    console.error("[v0] Fatal error in quick-fill:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
