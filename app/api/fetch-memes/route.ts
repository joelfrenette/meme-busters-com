import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchRedditMemes } from "@/lib/api/reddit"

export const maxDuration = 60

const MAX_TOTAL_MEMES = 200

const REDDIT_SUBREDDITS = [
  { id: "reddit-politicalmemes", name: "r/PoliticalMemes", sub: "PoliticalMemes" },
  { id: "reddit-politicalhumor", name: "r/PoliticalHumor", sub: "PoliticalHumor" },
  { id: "reddit-dankleft", name: "r/dankleft", sub: "dankleft" },
  { id: "reddit-therightcantmeme", name: "r/TheRightCantMeme", sub: "TheRightCantMeme" },
  { id: "reddit-theleftcantmeme", name: "r/TheLeftCantMeme", sub: "TheLeftCantMeme" },
  { id: "reddit-adviceanimals", name: "r/AdviceAnimals", sub: "AdviceAnimals" },
  { id: "reddit-memes", name: "r/memes", sub: "memes" },
]

const SITE_CONFIGS = {
  "reddit-politicalmemes": {
    name: "r/PoliticalMemes",
    strategies: [{ type: "reddit-api" as const, subreddit: "PoliticalMemes" }],
  },
  "reddit-politicalhumor": {
    name: "r/PoliticalHumor",
    strategies: [{ type: "reddit-api" as const, subreddit: "PoliticalHumor" }],
  },
  "reddit-dankleft": {
    name: "r/dankleft",
    strategies: [{ type: "reddit-api" as const, subreddit: "dankleft" }],
  },
  "reddit-therightcantmeme": {
    name: "r/TheRightCantMeme",
    strategies: [{ type: "reddit-api" as const, subreddit: "TheRightCantMeme" }],
  },
  "reddit-theleftcantmeme": {
    name: "r/TheLeftCantMeme",
    strategies: [{ type: "reddit-api" as const, subreddit: "TheLeftCantMeme" }],
  },
  "reddit-adviceanimals": {
    name: "r/AdviceAnimals",
    strategies: [{ type: "reddit-api" as const, subreddit: "AdviceAnimals" }],
  },
  "reddit-memes": {
    name: "r/memes",
    strategies: [{ type: "reddit-api" as const, subreddit: "memes" }],
  },
}

async function getExistingMemeUrls(): Promise<{ urls: Set<string>; hashes: Set<string>; filenames: Set<string> }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("meme_analyses").select("image_url")

    if (error) {
      console.error("[v0] Error fetching existing memes:", error)
      return { urls: new Set(), hashes: new Set(), filenames: new Set() }
    }

    const urls = new Set<string>()
    const hashes = new Set<string>()
    const filenames = new Set<string>()

    data?.forEach((meme) => {
      if (meme.image_url) {
        urls.add(meme.image_url)
        const filename = meme.image_url.split("/").pop()?.split("?")[0]?.split(".")[0] || ""
        if (filename) filenames.add(filename.toLowerCase())
        const urlHash = meme.image_url.split("/").pop()?.split("?")[0] || ""
        if (urlHash) hashes.add(urlHash.toLowerCase())
      }
    })

    console.log(`[v0] Found ${urls.size} existing memes in database`)
    return { urls, hashes, filenames }
  } catch (error) {
    console.error("[v0] Error querying database:", error)
    return { urls: new Set(), hashes: new Set(), filenames: new Set() }
  }
}

function isLikelyDuplicate(
  imageUrl: string,
  existingUrls: Set<string>,
  existingHashes: Set<string>,
  existingFilenames: Set<string>,
): boolean {
  if (existingUrls.has(imageUrl)) return true
  const fullFilename = imageUrl.split("/").pop()?.split("?")[0] || ""
  if (existingHashes.has(fullFilename.toLowerCase())) return true
  const filename = fullFilename.split(".")[0]?.toLowerCase() || ""
  if (filename && existingFilenames.has(filename)) return true
  return false
}

export async function POST(request: NextRequest) {
  console.log("[v0] ========== FETCH MEMES API CALLED ==========")

  try {
    let body
    try {
      const text = await request.text()
      console.log("[v0] Raw request body:", text)
      body = JSON.parse(text)
      console.log("[v0] Parsed body:", JSON.stringify(body))
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { sites, quickFill } = body

    let sitesToFetch: string[] = []
    if (quickFill) {
      sitesToFetch = REDDIT_SUBREDDITS.map((sub) => sub.id)
      console.log("[v0] Quick fill mode - fetching from all subreddits:", sitesToFetch.length)
    } else {
      sitesToFetch = sites && Array.isArray(sites) ? sites : []
      console.log("[v0] Manual mode - selected sites:", sitesToFetch)
    }

    if (sitesToFetch.length === 0) {
      console.log("[v0] No sites selected, returning error")
      return NextResponse.json({ success: false, error: "No sites selected" }, { status: 400 })
    }

    console.log("[v0] Getting existing meme URLs from database...")
    const { urls: existingUrls, hashes: existingHashes, filenames: existingFilenames } = await getExistingMemeUrls()
    console.log("[v0] Existing memes:", existingUrls.size)

    const allMemes: Array<{ url: string; source: string; title: string; upvotes?: number }> = []
    const failedSources: string[] = []

    console.log("[v0] Starting to fetch from", sitesToFetch.length, "sites")

    for (const siteId of sitesToFetch) {
      const config = SITE_CONFIGS[siteId as keyof typeof SITE_CONFIGS]
      if (!config) {
        console.log(`[v0] No config found for site: ${siteId}`)
        continue
      }

      try {
        console.log(`[v0] Processing ${config.name}...`)

        for (const strategy of config.strategies) {
          if (strategy.type === "reddit-api") {
            try {
              console.log(`[v0] Calling fetchRedditMemes for r/${strategy.subreddit}...`)
              const posts = await fetchRedditMemes(strategy.subreddit, "hot", 50)
              console.log(`[v0] Got ${posts.length} posts from r/${strategy.subreddit}`)

              for (const post of posts) {
                if (allMemes.length >= MAX_TOTAL_MEMES) {
                  console.log(`[v0] Reached max memes limit (${MAX_TOTAL_MEMES})`)
                  break
                }

                // Skip duplicates
                if (isLikelyDuplicate(post.url, existingUrls, existingHashes, existingFilenames)) {
                  console.log(`[v0] Skipping duplicate: ${post.title.substring(0, 50)}`)
                  continue
                }

                console.log(`[v0] Adding meme: ${post.title.substring(0, 50)}`)
                allMemes.push({
                  url: post.url,
                  source: config.name,
                  title: post.title,
                  upvotes: post.upvotes,
                })
              }

              console.log(`[v0] Total memes so far: ${allMemes.length}`)
            } catch (error) {
              console.error(`[v0] Reddit API error for ${config.name}:`, error)
              const errorMessage = error instanceof Error ? error.message : String(error)
              failedSources.push(`${config.name} (${errorMessage})`)
            }
            break
          }
        }
      } catch (error) {
        console.error(`[v0] Error fetching from ${config.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        failedSources.push(`${config.name} (${errorMessage})`)
      }
    }

    // Sort by popularity
    console.log("[v0] Sorting memes by popularity...")
    allMemes.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))

    console.log(`[v0] ========== FETCH COMPLETE ==========`)
    console.log(`[v0] Total memes found: ${allMemes.length}`)
    console.log(`[v0] Failed sources: ${failedSources.length}`)

    const response: any = { success: true, memes: allMemes }
    if (failedSources.length > 0) {
      response.warning = `Some sources failed: ${failedSources.join(", ")}`
      console.log(`[v0] Warning: ${response.warning}`)
    }

    console.log("[v0] Returning response with", allMemes.length, "memes")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] ========== FATAL ERROR ==========")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    )
  }
}
