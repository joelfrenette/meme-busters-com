"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink, LinkIcon, Upload, X, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const FACT_CHECK_SITES = [
  {
    id: "reddit-politicalmemes",
    name: "r/PoliticalMemes",
    url: "https://reddit.com/r/PoliticalMemes",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-politicalhumor",
    name: "r/PoliticalHumor",
    url: "https://reddit.com/r/PoliticalHumor",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-dankleft",
    name: "r/dankleft",
    url: "https://reddit.com/r/dankleft",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-therightcantmeme",
    name: "r/TheRightCantMeme",
    url: "https://reddit.com/r/TheRightCantMeme",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-theleftcantmeme",
    name: "r/TheLeftCantMeme",
    url: "https://reddit.com/r/TheLeftCantMeme",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-adviceanimals",
    name: "r/AdviceAnimals",
    url: "https://reddit.com/r/AdviceAnimals",
    category: "Reddit",
    requiresApi: true,
  },
  {
    id: "reddit-memes",
    name: "r/memes",
    url: "https://reddit.com/r/memes",
    category: "Reddit",
    requiresApi: true,
  },
]

interface FetchedMeme {
  url: string
  source: string
  title?: string
  selected: boolean
  upvotes?: number
}

export function FetchMemesClient() {
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [fetching, setFetching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [fetchedMemes, setFetchedMemes] = useState<FetchedMeme[]>([])
  const [progress, setProgress] = useState("")
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [totalProgress, setTotalProgress] = useState(0)
  const [maxProgress, setMaxProgress] = useState(0)
  const [warning, setWarning] = useState("")
  const [urls, setUrls] = useState("")
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [quickFilling, setQuickFilling] = useState(false)

  const toggleSite = (siteId: string) => {
    setSelectedSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
  }

  const toggleMeme = (index: number) => {
    setFetchedMemes((prev) => prev.map((meme, i) => (i === index ? { ...meme, selected: !meme.selected } : meme)))
  }

  const selectAll = () => {
    setFetchedMemes((prev) => prev.map((meme) => ({ ...meme, selected: true })))
  }

  const deselectAll = () => {
    setFetchedMemes((prev) => prev.map((meme) => ({ ...meme, selected: false })))
  }

  const clearAll = () => {
    setFetchedMemes([])
    setProgress("")
    setAnalysisComplete(false)
    setTotalProgress(0)
    setMaxProgress(0)
    setWarning("")
    setUrls("")
    setResults(null)
    setSelectedFiles([])
  }

  const quickFill = async () => {
    setQuickFilling(true)
    setProgress("Fetching trending memes from Reddit...")
    setResults(null)

    try {
      const response = await fetch("/api/quick-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Quick fill error:", response.status, errorData)
        setProgress(`Error: ${errorData.error || "Server error"}`)
        return
      }

      const data = await response.json()
      console.log("[v0] Quick fill response:", data)

      if (data.success) {
        setProgress(`✓ ${data.message}`)

        // Redirect to gallery after 2 seconds
        setTimeout(() => {
          window.location.href = "/gallery"
        }, 2000)
      } else {
        setProgress(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Quick fill error:", error)
      setProgress(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setQuickFilling(false)
    }
  }

  const fetchMemes = async () => {
    setFetching(true)
    setProgress("Fetching memes from selected sites...")
    setFetchedMemes([])
    setTotalProgress(0)
    setMaxProgress(selectedSites.length)
    setWarning("")

    try {
      const response = await fetch("/api/fetch-memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sites: selectedSites }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Fetch error:", response.status, errorText)
        setProgress(`Error: Server returned ${response.status}`)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        setProgress(`Error: Server returned non-JSON response`)
        return
      }

      const data = await response.json()

      if (data.success) {
        const validMemes = data.memes.filter((meme: any) => {
          try {
            new URL(meme.url)
            return true
          } catch {
            return false
          }
        })

        setFetchedMemes(validMemes.map((meme: any) => ({ ...meme, selected: true })))
        setProgress(`Found ${validMemes.length} memes`)
        setTotalProgress(selectedSites.length)

        if (data.warning) {
          setWarning(data.warning)
        }
      } else {
        setProgress(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Fetch memes error:", error)
      setProgress(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setFetching(false)
    }
  }

  const analyzeSelected = async () => {
    const selected = fetchedMemes.filter((m) => m.selected)
    if (selected.length === 0) return

    setAnalyzing(true)
    setAnalysisComplete(false)
    setMaxProgress(selected.length)
    setTotalProgress(0)

    let completed = 0
    let savedCount = 0

    for (const meme of selected) {
      try {
        setProgress(`Analyzing meme ${completed + 1}/${selected.length}...`)
        setTotalProgress(completed)

        const response = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: meme.url }),
        })

        const data = await response.json()

        if (data.success) {
          savedCount++
        }

        completed++
        setTotalProgress(completed)
        setProgress(`Analyzed ${completed}/${selected.length} memes (${savedCount} saved)`)
      } catch (error) {
        completed++
        setTotalProgress(completed)
      }
    }

    setAnalysisComplete(true)
    setProgress(`✓ Successfully analyzed and saved ${savedCount} memes to the gallery!`)
    setAnalyzing(false)

    setTimeout(() => {
      setFetchedMemes([])
      setAnalysisComplete(false)
      setProgress("")
      setTotalProgress(0)
      setMaxProgress(0)
      setWarning("")
    }, 3000)
  }

  const importUrls = async () => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    if (urlList.length === 0) {
      setProgress("Please enter at least one URL")
      return
    }

    setImporting(true)
    setProgress(`Importing ${urlList.length} meme(s)...`)
    setResults(null)

    try {
      const response = await fetch("/api/import-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Import error:", response.status, errorData)
        setProgress(`Error: ${errorData.error || "Server error"}`)
        return
      }

      const data = await response.json()
      console.log("[v0] Import response:", data)

      if (data.success) {
        setProgress(data.message)
        setResults(data.results)

        if (data.results.success > 0) {
          setUrls("")
          setTimeout(() => {
            window.location.href = "/gallery"
          }, 3000)
        }
      } else {
        setProgress(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      setProgress(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setImporting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  const uploadAndAnalyzeFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploadingFiles(true)
    setProgress(`Uploading and analyzing ${selectedFiles.length} file(s)...`)
    setMaxProgress(selectedFiles.length)
    setTotalProgress(0)
    setResults(null)

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      try {
        setProgress(`Processing ${i + 1}/${selectedFiles.length}: ${file.name}`)

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const response = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64 }),
        })

        if (response.ok) {
          successCount++
        } else {
          failedCount++
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          errors.push(`${file.name}: ${errorData.error || "Failed to analyze"}`)
        }
      } catch (error) {
        failedCount++
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      setTotalProgress(i + 1)
    }

    setUploadingFiles(false)
    setProgress(`✓ Completed: ${successCount} successful, ${failedCount} failed`)
    setResults({ success: successCount, failed: failedCount, errors })

    if (successCount > 0) {
      setTimeout(() => {
        setSelectedFiles([])
        window.location.href = "/gallery"
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Import Memes</h1>

        {/* Quick Fill section */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Quick Fill (Recommended)
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Automatically fetch up to 99 trending political memes from Reddit in one click
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  r/PoliticalMemes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  r/PoliticalHumor
                </Badge>
                <Badge variant="outline" className="text-xs">
                  r/TheRightCantMeme
                </Badge>
                <Badge variant="outline" className="text-xs">
                  +4 more
                </Badge>
              </div>
            </div>
            <Button
              onClick={quickFill}
              disabled={quickFilling}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white ml-4"
            >
              {quickFilling ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Fill
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-orange-600" />
              Top Political Meme Subreddits
            </h3>
            <div className="space-y-2">
              {FACT_CHECK_SITES.map((sub) => (
                <a
                  key={sub.id}
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition-colors group"
                >
                  <span className="text-sm font-medium text-orange-900">{sub.name}</span>
                  <ExternalLink className="h-3 w-3 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              Other Meme Sites
            </h3>
            <div className="space-y-2">
              {[
                { name: "Imgur Politics", url: "https://imgur.com/t/politics" },
                { name: "Know Your Meme", url: "https://knowyourmeme.com" },
                { name: "9GAG Politics", url: "https://9gag.com/politics" },
                { name: "Memedroid", url: "https://memedroid.com/tags/politics" },
                { name: "iFunny Politics", url: "https://ifunny.co/tags/politics" },
                { name: "Twitter/X #PoliticalMemes", url: "https://twitter.com/search?q=%23PoliticalMemes" },
                { name: "Instagram @politicalmemes", url: "https://instagram.com/politicalmemes" },
                { name: "Tumblr Political Memes", url: "https://tumblr.com/tagged/political-memes" },
                { name: "Pinterest Political Memes", url: "https://pinterest.com/search/pins/?q=political%20memes" },
              ].map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition-colors group"
                >
                  <span className="text-sm font-medium text-blue-900">{site.name}</span>
                  <ExternalLink className="h-3 w-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-cyan-600" />
                How to Import Memes
              </h2>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Browse any of the sites above in your browser</li>
                <li>Right-click on meme images and select "Copy image address" or "Copy image link"</li>
                <li>Paste the URLs below (one per line)</li>
                <li>Click "Import & Analyze" to automatically download and analyze them</li>
              </ol>
              <div className="mt-4 p-3 bg-white rounded border border-cyan-200">
                <p className="text-xs font-medium text-cyan-900 mb-1">💡 Pro Tip:</p>
                <p className="text-xs text-cyan-800">
                  Look for image URLs ending in .jpg, .png, or .gif. Reddit image URLs typically look like:
                  i.redd.it/xyz123.jpg or preview.redd.it/xyz123.png
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            Upload Files from Folder
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select multiple meme images from your computer to upload and analyze at once
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("bulk-file-input")?.click()}
                disabled={uploadingFiles}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <input
                id="bulk-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadingFiles}
              />
              {selectedFiles.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFiles}
                  disabled={uploadingFiles}
                  className="text-red-600 bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">{selectedFiles.length} file(s) selected:</p>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={uploadingFiles}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={uploadAndAnalyzeFiles}
                  disabled={uploadingFiles}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading & Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Upload & Analyze {selectedFiles.length} File(s)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Paste Meme URLs</h2>
          <p className="text-sm text-muted-foreground mb-4">Enter one URL per line</p>

          <Textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Paste image URLs here, one per line"
            className="min-h-[200px] font-mono text-sm mb-4"
            disabled={importing}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {urls.split("\n").filter((url) => url.trim().length > 0).length} URL(s) entered
            </p>
            <Button
              onClick={importUrls}
              disabled={importing || urls.trim().length === 0}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import & Analyze
                </>
              )}
            </Button>
          </div>
        </Card>

        {fetchedMemes.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Fetched Memes ({fetchedMemes.length})</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
                <Button
                  onClick={analyzeSelected}
                  disabled={analyzing || !fetchedMemes.some((m) => m.selected)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Analyze Selected ({fetchedMemes.filter((m) => m.selected).length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fetchedMemes.map((meme, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Checkbox checked={meme.selected} onCheckedChange={() => toggleMeme(index)} />
                    <Badge variant="outline" className="text-xs">
                      {meme.source}
                    </Badge>
                    {meme.upvotes && meme.upvotes > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ↑ {meme.upvotes}
                      </Badge>
                    )}
                  </div>
                  <div className="relative w-full h-48 mb-2 bg-muted rounded">
                    <Image
                      src={meme.url || "/placeholder.svg"}
                      alt="Meme"
                      fill
                      className="object-contain rounded"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/funny-dog-struggle.png"
                      }}
                    />
                  </div>
                  {meme.title && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{meme.title}</p>}
                  <p className="text-xs text-muted-foreground break-all">{meme.url}</p>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {(fetching || analyzing || uploadingFiles || quickFilling) && maxProgress > 0 && (
          <Card className="p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress}</span>
                <span className="font-medium">
                  {totalProgress}/{maxProgress}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(totalProgress / maxProgress) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {progress && !fetching && !analyzing && !uploadingFiles && !quickFilling && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{progress}</p>
              {results && results.success > 0 && (
                <Link href="/gallery">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Gallery
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {results && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Import Results</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium text-green-900">Successfully imported</span>
                <Badge className="bg-green-600">{results.success}</Badge>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                  <span className="text-sm font-medium text-red-900">Failed</span>
                  <Badge variant="destructive">{results.failed}</Badge>
                </div>
              )}
              {results.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-900 mb-2">Errors:</p>
                  <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                    {results.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="break-all">
                        {error}
                      </li>
                    ))}
                    {results.errors.length > 5 && (
                      <li className="text-yellow-700 italic">...and {results.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
