// Simple Reddit JSON API fetcher - no authentication required

export interface RedditMeme {
  title: string
  url: string
  permalink: string
  score: number
  subreddit: string
  author: string
  created: number
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchRedditMemesSimple(subreddit: string, limit = 25): Promise<RedditMeme[]> {
  try {
    const url = `https://old.reddit.com/r/${subreddit}/hot.json?limit=${limit}`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://old.reddit.com/",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      throw new Error(`Reddit returned ${response.status}`)
    }

    const data = await response.json()
    const posts = data?.data?.children || []

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
          postData.url.includes("i.imgur.com"))
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

    return memes
  } catch (error) {
    console.error(`Error fetching from r/${subreddit}:`, error)
    return []
  }
}
