-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON meme_analyses;
DROP POLICY IF EXISTS "Allow public insert" ON meme_analyses;
DROP POLICY IF EXISTS "Allow authenticated delete" ON meme_analyses;
DROP POLICY IF EXISTS "Allow delete for all users" ON meme_analyses;

-- Recreate policies with proper permissions
CREATE POLICY "Allow public read access"
ON meme_analyses FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert"
ON meme_analyses FOR INSERT
TO public
WITH CHECK (true);

-- Create a permissive DELETE policy that allows all authenticated and anonymous users
CREATE POLICY "Allow all delete access"
ON meme_analyses FOR DELETE
TO public
USING (true);

-- Verify RLS is enabled
ALTER TABLE meme_analyses ENABLE ROW LEVEL SECURITY;
