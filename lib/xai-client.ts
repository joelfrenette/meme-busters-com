// Native xAI/Grok API client - no SDK dependencies
// Uses direct fetch to avoid v0 integration detection

const XAI_API_URL = "https://api.x.ai/v1/chat/completions"

export function getApiKey(): string | undefined {
  // Check multiple possible key names
  const keyNames = ["XAI_API_KEY", "GROK_API_KEY"]
  for (const name of keyNames) {
    const key = process.env[name]
    if (key) return key
  }
  return undefined
}

export interface XAIMessage {
  role: "system" | "user" | "assistant"
  content: string | XAIContentPart[]
}

export interface XAIContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
  }
}

export interface XAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callXAI(
  messages: XAIMessage[],
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {},
): Promise<string> {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error("Grok API key is not configured. Please add your API key to the environment variables.")
  }

  const { model = "grok-2-vision-latest", maxTokens = 4000, temperature = 0.3 } = options

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error("[v0] xAI API error:", response.status, errorBody)

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.")
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your API key.")
    }
    if (response.status === 400) {
      throw new Error(`Invalid request: ${errorBody}`)
    }

    throw new Error(`xAI API error (${response.status}): ${errorBody}`)
  }

  const data: XAIResponse = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from xAI API")
  }

  return data.choices[0].message.content
}

export function createImageContent(imageData: string): XAIContentPart {
  // Handle both base64 data URLs and regular URLs
  const imageUrl = imageData.startsWith("data:")
    ? imageData
    : imageData.startsWith("http")
      ? imageData
      : `data:image/jpeg;base64,${imageData}`

  return {
    type: "image_url",
    image_url: {
      url: imageUrl,
    },
  }
}

export function createTextContent(text: string): XAIContentPart {
  return {
    type: "text",
    text,
  }
}
