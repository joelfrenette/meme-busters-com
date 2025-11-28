-- Update verdict categories to focus on truthfulness instead of propaganda
-- This migration removes PROPAGANDA and adds new truthfulness-focused categories

-- Drop the old constraint
ALTER TABLE meme_analyses DROP CONSTRAINT IF EXISTS meme_analyses_verdict_check;

-- Add new constraint with updated categories
ALTER TABLE meme_analyses ADD CONSTRAINT meme_analyses_verdict_check 
CHECK (verdict IN (
  -- Truthfulness & Accuracy categories
  'FACTUAL',
  'MISLEADING',
  'OUT_OF_CONTEXT',
  'DISTORTED',
  'MISINFORMATION',
  'LIES',
  'UNVERIFIABLE',
  -- Tone-Based categories
  'SARCASM',
  'SATIRE',
  'HUMOR',
  'WHOLESOME',
  'DARK_HUMOR',
  -- Legacy categories (for backward compatibility with existing data)
  'DISHONEST',
  'PROPAGANDA'
));

-- Update existing PROPAGANDA entries to MISINFORMATION (closest equivalent)
UPDATE meme_analyses 
SET verdict = 'MISINFORMATION' 
WHERE verdict = 'PROPAGANDA';

-- Update existing DISHONEST entries to MISLEADING (closest equivalent)
UPDATE meme_analyses 
SET verdict = 'MISLEADING' 
WHERE verdict = 'DISHONEST';

-- Now remove legacy categories from constraint
ALTER TABLE meme_analyses DROP CONSTRAINT meme_analyses_verdict_check;

ALTER TABLE meme_analyses ADD CONSTRAINT meme_analyses_verdict_check 
CHECK (verdict IN (
  'FACTUAL',
  'MISLEADING',
  'OUT_OF_CONTEXT',
  'DISTORTED',
  'MISINFORMATION',
  'LIES',
  'UNVERIFIABLE',
  'SARCASM',
  'SATIRE',
  'HUMOR',
  'WHOLESOME',
  'DARK_HUMOR'
));
