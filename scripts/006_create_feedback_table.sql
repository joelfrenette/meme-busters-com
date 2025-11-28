-- Create feedback table for user input on meme analyses
CREATE TABLE IF NOT EXISTS public.meme_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID NOT NULL REFERENCES public.meme_analyses(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('dispute', 'clarify', 'reanalyze')),
  user_context TEXT NOT NULL,
  cultural_context TEXT,
  historical_context TEXT,
  additional_sources TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'incorporated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meme_feedback_meme_id ON public.meme_feedback(meme_id);
CREATE INDEX IF NOT EXISTS idx_meme_feedback_status ON public.meme_feedback(status);

-- Add RLS policies
ALTER TABLE public.meme_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read feedback
CREATE POLICY "Allow public read access" ON public.meme_feedback
  FOR SELECT USING (true);

-- Allow anyone to insert feedback
CREATE POLICY "Allow public insert access" ON public.meme_feedback
  FOR INSERT WITH CHECK (true);

-- Add a column to meme_analyses to track if it has been re-analyzed with feedback
ALTER TABLE public.meme_analyses 
ADD COLUMN IF NOT EXISTS feedback_incorporated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_analysis_id UUID REFERENCES public.meme_analyses(id);

COMMENT ON TABLE public.meme_feedback IS 'Stores user feedback on meme analyses for human-in-the-loop improvements';
