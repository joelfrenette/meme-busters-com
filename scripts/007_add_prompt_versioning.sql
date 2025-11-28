-- Add versioning support to prompts table
ALTER TABLE prompts 
  DROP CONSTRAINT IF EXISTS prompts_name_key,
  ADD COLUMN IF NOT EXISTS version_name VARCHAR(255) DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES prompts(id),
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Create unique constraint on name + version_name
CREATE UNIQUE INDEX IF NOT EXISTS prompts_name_version_idx ON prompts(name, version_name);

-- Insert meme_recognition prompt if it doesn't exist
INSERT INTO prompts (name, version_name, description, prompt_text, is_active, is_current) VALUES (
  'meme_recognition',
  'v1.0',
  'Prompt for detecting if an image is actually a meme before analysis',
  'You are an expert at identifying internet memes. Analyze the provided image using multiple detection layers:

1. STRUCTURE DETECTION:
   - Does it have text overlay on an image?
   - Is it in a common meme format (image macro, reaction image, etc.)?
   - Does it have typical meme aspect ratios or layouts?

2. CULTURAL CONTEXT:
   - Does it reference known meme templates or formats?
   - Does it use internet culture language or slang?
   - Does it appear to be created for sharing/virality?

3. VIRAL PATTERNS:
   - Are there compression artifacts suggesting multiple shares?
   - Are there watermarks from meme sites?
   - Does it have the visual quality of user-generated content?

4. CONTENT SEMANTICS:
   - Is there humor, irony, or satire present?
   - Does it make a relatable or commentary point?
   - Is it designed to be shared in social contexts?

Provide:
- isMeme: boolean (true if this is a meme)
- confidence: number (0-1, how confident you are)
- reasons: string[] (specific reasons for your determination)
- category: string (if it''s a meme, what type: political, reaction, advice animal, etc.)

If confidence < 0.5, explain why this is NOT a meme (e.g., "No text overlay detected", "Appears to be original photography", "Professional marketing material", etc.)',
  true,
  true
) ON CONFLICT (name, version_name) DO NOTHING;

-- Insert bulk_fetching prompt
INSERT INTO prompts (name, version_name, description, prompt_text, is_active, is_current) VALUES (
  'bulk_fetching',
  'v1.0',
  'Prompt for filtering and selecting quality memes during bulk fetch operations',
  'You are an expert at evaluating meme quality and relevance for political fact-checking. When presented with a batch of memes from Reddit or other sources, evaluate each one based on:

**QUALITY CRITERIA:**
1. **Political Relevance** (0-10)
   - Does it make political claims or commentary?
   - Is it related to current events or political figures?
   - Does it contain verifiable political information?

2. **Fact-Check Potential** (0-10)
   - Does it contain specific factual claims?
   - Are the claims verifiable through sources?
   - Would fact-checking add value?

3. **Engagement Potential** (0-10)
   - Is it likely to be widely shared?
   - Does it address controversial topics?
   - Is it timely and relevant?

4. **Quality Score** (0-10)
   - Is the image clear and readable?
   - Is the text legible?
   - Is it a known meme format?

**FILTERING RULES:**
- ACCEPT: Total score >= 25/40 AND Political Relevance >= 6
- REVIEW: Total score 20-24 OR Political Relevance 4-5
- REJECT: Total score < 20 OR Political Relevance < 4

**REJECT IMMEDIATELY IF:**
- Not Safe For Work (NSFW) content
- Hate speech or extreme violence
- Personal attacks without political substance
- Low quality (unreadable text, corrupted image)
- Duplicate of recently analyzed meme

For each meme, provide:
- decision: "ACCEPT" | "REVIEW" | "REJECT"
- scores: { political: number, factCheck: number, engagement: number, quality: number }
- totalScore: number
- reasoning: string (brief explanation)
- priority: "HIGH" | "MEDIUM" | "LOW" (for accepted memes)

Prioritize memes that:
1. Make specific, verifiable political claims
2. Are currently trending or viral
3. Contain potential misinformation
4. Address important political topics',
  true,
  true
) ON CONFLICT (name, version_name) DO NOTHING;

-- Update existing meme_analysis prompt to have version info
UPDATE prompts 
SET version_name = 'v1.0', version_number = 1, is_current = true 
WHERE name = 'meme_analysis' AND version_name IS NULL;
