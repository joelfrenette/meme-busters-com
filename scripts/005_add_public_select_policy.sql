-- Enable RLS on meme_analyses table (if not already enabled)
ALTER TABLE meme_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Allow public read access to meme analyses" ON meme_analyses;

-- Create policy to allow anyone to SELECT (read) meme analyses
-- This allows the gallery and results pages to display memes publicly
CREATE POLICY "Allow public read access to meme analyses"
ON meme_analyses
FOR SELECT
TO public
USING (true);

-- Note: INSERT, UPDATE, and DELETE operations still require authentication
-- Only SELECT (read) operations are publicly accessible
