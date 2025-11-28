import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

const SQL_SCRIPT = `-- Create meme_analyses table
CREATE TABLE IF NOT EXISTS meme_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('FACTUAL', 'DISHONEST', 'LIAR')),
  overall_explanation TEXT,
  claims JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meme_analyses_verdict ON meme_analyses(verdict);
CREATE INDEX IF NOT EXISTS idx_meme_analyses_analyzed_at ON meme_analyses(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE meme_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DROP POLICY IF EXISTS "Allow public read access" ON meme_analyses;
CREATE POLICY "Allow public read access" ON meme_analyses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON meme_analyses;
CREATE POLICY "Allow public insert" ON meme_analyses FOR INSERT WITH CHECK (true);`

export default async function SetupPage() {
  const supabase = await createClient()

  // Check if table exists
  const { error: checkError } = await supabase.from("meme_analyses").select("id").limit(1)

  const tableExists = !checkError || checkError.code !== "PGRST205"

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8">
        <h1 className="text-3xl font-bold mb-4">Database Setup</h1>

        {tableExists ? (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold text-lg">✓ Database table already exists!</p>
            <p className="text-gray-600">Your meme_analyses table is set up and ready to use.</p>
            <Button asChild className="bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)]">
              <a href="/">Go to Home</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-2">
                The database table needs to be created before you can start analyzing memes.
              </p>
              <p className="text-sm text-gray-500">
                Follow these steps to create the <code className="bg-gray-100 px-2 py-1 rounded">meme_analyses</code>{" "}
                table in your Supabase database:
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Go to your Supabase project dashboard</li>
                <li>Click on the "SQL Editor" in the left sidebar</li>
                <li>Click "New Query"</li>
                <li>Copy the SQL script below and paste it into the editor</li>
                <li>Click "Run" to execute the script</li>
                <li>Return here and refresh the page to verify setup</li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">SQL Script:</h3>
                <CopyButton text={SQL_SCRIPT} />
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
                {SQL_SCRIPT}
              </pre>
            </div>

            <div className="flex gap-4">
              <Button asChild variant="outline">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Open Supabase Dashboard
                </a>
              </Button>
              <Button asChild className="bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)]">
                <a href="/setup">Refresh Page</a>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
