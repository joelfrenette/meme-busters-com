-- Add DELETE policy for meme_analyses table
-- This allows deletion of meme records

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public delete" ON meme_analyses;

-- Add DELETE policy to allow all deletes (since we're handling auth in the app)
CREATE POLICY "Allow public delete" ON meme_analyses
  FOR DELETE
  USING (true);
