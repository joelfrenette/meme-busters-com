-- Create meme_feedback table for user feedback on meme analyses
CREATE TABLE IF NOT EXISTS public.meme_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id UUID NOT NULL REFERENCES public.meme_analyses(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('dispute', 'clarify', 'reanalyze')),
    user_context TEXT NOT NULL,
    cultural_context TEXT,
    historical_context TEXT,
    additional_sources TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by meme_id
CREATE INDEX IF NOT EXISTS idx_meme_feedback_meme_id ON public.meme_feedback(meme_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_meme_feedback_created_at ON public.meme_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.meme_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback
CREATE POLICY IF NOT EXISTS "Allow public insert feedback"
ON public.meme_feedback
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow anyone to read feedback
CREATE POLICY IF NOT EXISTS "Allow public read feedback"
ON public.meme_feedback
FOR SELECT
TO public
USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.meme_feedback TO anon;
GRANT SELECT, INSERT ON public.meme_feedback TO authenticated;
