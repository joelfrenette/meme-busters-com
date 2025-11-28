-- Create meme_analyses table to store fact-checked memes
CREATE TABLE IF NOT EXISTS meme_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('FACTUAL', 'DISHONEST', 'LIAR')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  overall_explanation TEXT NOT NULL,
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meme_analyses_verdict ON meme_analyses(verdict);
CREATE INDEX IF NOT EXISTS idx_meme_analyses_analyzed_at ON meme_analyses(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE meme_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON meme_analyses
  FOR SELECT
  USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Allow public insert access" ON meme_analyses
  FOR INSERT
  WITH CHECK (true);
