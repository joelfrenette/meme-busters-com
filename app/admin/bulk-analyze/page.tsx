"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function BulkAnalyzePage() {
  const [imageUrls, setImageUrls] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError("")
    setResults([])

    const urls = imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    if (urls.length === 0) {
      setError("Please enter at least one image URL")
      setIsAnalyzing(false)
      return
    }

    console.log("[v0] Starting bulk analysis for", urls.length, "memes")

    const analysisResults = []

    for (const url of urls) {
      try {
        console.log("[v0] Analyzing:", url)

        const response = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        })

        if (!response.ok) {
          throw new Error(`Failed to analyze: ${response.statusText}`)
        }

        const result = await response.json()
        analysisResults.push({ url, success: true, result })
        console.log("[v0] Success:", url)
      } catch (err) {
        console.error("[v0] Error analyzing:", url, err)
        analysisResults.push({
          url,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    setResults(analysisResults)
    setIsAnalyzing(false)
    console.log("[v0] Bulk analysis complete")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Bulk Meme Analysis</h1>
        <p className="text-muted-foreground mb-6">Enter meme image URLs (one per line) to analyze them in bulk</p>

        <Card className="p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Image URLs (one per line)</label>
          <Textarea
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            placeholder="https://example.com/meme1.jpg&#x0A;https://example.com/meme2.jpg&#x0A;https://example.com/meme3.jpg"
            rows={10}
            className="mb-4"
          />

          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing {results.length} of {imageUrls.split("\n").filter((u) => u.trim()).length}...
              </>
            ) : (
              "Analyze All Memes"
            )}
          </Button>

          {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">{error}</div>}
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Results</h2>
            {results.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <img src={result.url || "/placeholder.svg"} alt="Meme" className="w-24 h-24 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2 break-all">{result.url}</p>
                    {result.success ? (
                      <div className="text-green-600 font-medium">✓ Successfully analyzed</div>
                    ) : (
                      <div className="text-red-600">✗ Failed: {result.error}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
