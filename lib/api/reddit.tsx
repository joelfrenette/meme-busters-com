// Reddit Public JSON API integration
// No authentication required for public subreddits

interface RedditPost {
  url: string
  title: string
  upvotes: number
  comments: number
  subreddit: string
}

export async function fetchRedditMemes(
  subreddit: string,
  sort: "hot" | "top" | "new" = "hot",
  limit = 100,
): Promise<RedditPost[]> {
  try {
    console.log(`[v0] Fetching from r/${subreddit}...`)

    let url = `https://www.reddit.com/r/${subreddit}/${sort}.json`
    const params = new URLSearchParams({ limit: limit.toString() })

    if (sort === "top") {
      params.append("t", "week")
    }

    url += `?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MemeBot/1.0; +https://meme-busters.com)",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Reddit API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200),
        url,
      })
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const posts: RedditPost[] = []

    if (data?.data?.children) {
      for (const post of data.data.children) {
        const postData = post.data

        if (postData.stickied || postData.distinguished) continue

        let imageUrl = ""

        if (postData.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(postData.url)) {
          imageUrl = postData.url
        } else if (postData.preview?.images?.[0]?.source?.url) {
          imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, "&")
        } else if (postData.is_gallery && postData.media_metadata) {
          const firstImage = Object.values(postData.media_metadata)[0] as any
          if (firstImage?.s?.u) {
            imageUrl = firstImage.s.u.replace(/&amp;/g, "&")
          }
        }

        if (imageUrl) {
          posts.push({
            url: imageUrl,
            title: postData.title || "Meme from Reddit",
            upvotes: postData.ups || 0,
            comments: postData.num_comments || 0,
            subreddit: subreddit,
          })
        }
      }
    }

    posts.sort((a, b) => b.upvotes + b.comments - (a.upvotes + a.comments))

    console.log(`[v0] Fetched ${posts.length} memes from r/${subreddit}`)
    return posts
  } catch (error) {
    console.error(`[v0] Error fetching from r/${subreddit}:`, error)
    throw error
  }
}

export function isRedditConfigured(): boolean {
  return true
}
