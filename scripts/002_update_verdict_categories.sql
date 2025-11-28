-- Migration: Update verdict categories to include new taxonomy
-- This updates the meme_analyses table to support the expanded verdict categories

-- Drop the old check constraint
ALTER TABLE meme_analyses 
DROP CONSTRAINT IF EXISTS meme_analyses_verdict_check;

-- Add new check constraint with expanded categories
ALTER TABLE meme_analyses 
ADD CONSTRAINT meme_analyses_verdict_check 
CHECK (verdict IN (
  'FACTUAL', 
  'DISHONEST', 
  'LIES', 
  'PROPAGANDA',
  'SARCASM',
  'SATIRE',
  'HUMOR',
  'WHOLESOME',
  'DARK_HUMOR'
));

-- Update any existing 'LIAR' verdicts to 'LIES' for consistency
UPDATE meme_analyses 
SET verdict = 'LIES' 
WHERE verdict = 'LIAR';
