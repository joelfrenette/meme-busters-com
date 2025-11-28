"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react"

export default function BulkImportPage() {
  const [jsonInput, setJsonInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")

  const handleBulkAnalyze = async () => {
    setError("")
    setResults(null)

    try {
      // Parse the JSON input
      const memes = JSON.parse(jsonInput)

      if (!Array.isArray(memes)) {
        setError("Input must be a JSON array of meme objects")
        return
      }

      setIsAnalyzing(true)

      // Call the bulk analyze API
      const response = await fetch("/api/bulk-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memes }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Failed to analyze memes")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON or analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk Meme Import & Analysis</h1>
          <p className="text-muted-foreground">Import and analyze multiple memes from fact-checking sites</p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Paste JSON from scraped_memes.json</label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "image_url": "https://example.com/meme.jpg",\n    "source_article": "https://...",\n    "source_site": "factcheck.org"\n  }\n]`}
              className="font-mono text-sm min-h-[300px]"
            />
          </div>

          <Button onClick={handleBulkAnalyze} disabled={isAnalyzing || !jsonInput.trim()} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Memes...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze All Memes
              </>
            )}
          </Button>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Analysis Complete</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{results.analyzed}</div>
                <div className="text-sm text-green-600">Successfully Analyzed</div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{results.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Errors:</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {results.errors.map((err: any, i: number) => (
                    <div key={i} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                      {err.meme.image_url}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert>
              <AlertDescription>
                All analyzed memes have been saved to the database and are now visible in the Gallery and Admin
                Dashboard.
              </AlertDescription>
            </Alert>
          </Card>
        )}
      </div>
    </div>
  )
}
