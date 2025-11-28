// Reddit OAuth API for authenticated access

export interface RedditMeme {
  title: string
  url: string
  permalink: string
  score: number
  subreddit: string
  author: string
  created: number
}

let cachedToken: { token: string; expires: number } | null = null

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const userAgent = process.env.REDDIT_USER_AGENT || "web:meme-busters:v1.0.0 (by /u/memebusters)"

  if (!clientId || !clientSecret) {
    throw new Error("Reddit API credentials not configured")
  }

  // Encode credentials for Basic Auth
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  console.log("[v0] Requesting Reddit access token...")

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Reddit OAuth error:", response.status, errorText)
    throw new Error(`Reddit OAuth failed: ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] Successfully obtained Reddit access token")

  // Cache the token (expires in 1 hour, we'll refresh after 50 minutes)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + 50 * 60 * 1000, // 50 minutes
  }

  return data.access_token
}

export async function fetchRedditMemesOAuth(subreddit: string, limit = 25): Promise<RedditMeme[]> {
  try {
    const accessToken = await getAccessToken()
    const userAgent = process.env.REDDIT_USER_AGENT || "web:meme-busters:v1.0.0 (by /u/memebusters)"

    const url = `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`

    console.log(`[v0] Fetching from r/${subreddit} with OAuth...`)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Reddit API error for r/${subreddit}:`, response.status, errorText)
      throw new Error(`Reddit API returned ${response.status}`)
    }

    const data = await response.json()
    const posts = data?.data?.children || []

    console.log(`[v0] Got ${posts.length} posts from r/${subreddit}`)

    const memes: RedditMeme[] = []

    for (const post of posts) {
      const postData = post.data

      // Only include posts with images
      if (
        postData.url &&
        (postData.url.endsWith(".jpg") ||
          postData.url.endsWith(".jpeg") ||
          postData.url.endsWith(".png") ||
          postData.url.endsWith(".gif") ||
          postData.url.includes("i.redd.it") ||
          postData.url.includes("i.imgur.com") ||
          postData.url.includes("preview.redd.it"))
      ) {
        memes.push({
          title: postData.title,
          url: postData.url,
          permalink: `https://www.reddit.com${postData.permalink}`,
          score: postData.score,
          subreddit: postData.subreddit,
          author: postData.author,
          created: postData.created_utc,
        })
      }
    }

    console.log(`[v0] Filtered to ${memes.length} image posts`)

    return memes
  } catch (error) {
    console.error(`[v0] Error fetching from r/${subreddit}:`, error)
    return []
  }
}
