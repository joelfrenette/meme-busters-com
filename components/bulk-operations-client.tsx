"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, Loader2, Trash2, Copy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface Meme {
  id: string
  image_url: string
  verdict: string
  claims: any[]
  created_at: string
  selected?: boolean
}

export function BulkOperationsClient({ memes: initialMemes }: { memes: Meme[] }) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes.map((m) => ({ ...m, selected: false })))
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState("")
  const [progressPercent, setProgressPercent] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<Meme[][]>([])

  const filteredMemes = memes.filter(
    (meme) =>
      meme.verdict.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meme.claims?.some((claim: any) => claim.text?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const toggleMeme = (id: string) => {
    setMemes((prev) => prev.map((meme) => (meme.id === id ? { ...meme, selected: !meme.selected } : meme)))
  }

  const selectAll = () => {
    setMemes((prev) => prev.map((meme) => ({ ...meme, selected: true })))
  }

  const deselectAll = () => {
    setMemes((prev) => prev.map((meme) => ({ ...meme, selected: false })))
  }

  const reanalyzeSelected = async () => {
    const selected = memes.filter((m) => m.selected)
    if (selected.length === 0) return

    setProcessing(true)
    setProgressPercent(0)
    setProgress(`Starting re-analysis of ${selected.length} memes...`)

    const CONCURRENT_REQUESTS = 5
    const CHUNK_SIZE = 10

    let completed = 0
    let succeeded = 0
    let failed = 0
    const errors: Array<{ id: string; error: string }> = []

    const processMeme = async (meme: Meme) => {
      try {
        const response = await fetch("/api/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: meme.image_url, memeId: meme.id }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        succeeded++
        return { success: true, id: meme.id }
      } catch (error) {
        failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push({ id: meme.id, error: errorMessage })
        console.error(`[v0] Error re-analyzing meme ${meme.id}:`, errorMessage)
        return { success: false, id: meme.id, error: errorMessage }
      } finally {
        completed++
        const percent = Math.round((completed / selected.length) * 100)
        setProgressPercent(percent)
        setProgress(`Re-analyzing: ${completed}/${selected.length} (${succeeded} succeeded, ${failed} failed)`)
      }
    }

    const processBatch = async (batch: Meme[]) => {
      const promises: Promise<any>[] = []
      for (let i = 0; i < batch.length; i += CONCURRENT_REQUESTS) {
        const chunk = batch.slice(i, i + CONCURRENT_REQUESTS)
        const chunkPromises = chunk.map((meme) => processMeme(meme))
        await Promise.all(chunkPromises)
      }
    }

    await processBatch(selected)

    if (failed === 0) {
      setProgress(`✓ Successfully re-analyzed all ${succeeded} memes!`)
    } else {
      setProgress(
        `⚠ Completed: ${succeeded} succeeded, ${failed} failed. ${errors.length > 0 ? "Check console for errors." : ""}`,
      )
      if (errors.length > 0) {
        console.error("[v0] Failed meme re-analyses:", errors)
      }
    }

    setProcessing(false)
    setTimeout(() => window.location.reload(), 3000)
  }

  const deleteSelected = async () => {
    const selected = memes.filter((m) => m.selected)
    if (selected.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selected.length} memes? This cannot be undone.`)) {
      return
    }

    setProcessing(true)
    setProgressPercent(0)
    setProgress(`Deleting ${selected.length} memes...`)

    const CONCURRENT_REQUESTS = 10
    let completed = 0
    let succeeded = 0
    let failed = 0

    const deleteMeme = async (meme: Meme) => {
      try {
        const response = await fetch("/api/admin/delete-meme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memeId: meme.id }),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        succeeded++
        return { success: true, id: meme.id }
      } catch (error) {
        failed++
        console.error("Error deleting meme:", error)
        return { success: false, id: meme.id }
      } finally {
        completed++
        const percent = Math.round((completed / selected.length) * 100)
        setProgressPercent(percent)
        setProgress(`Deleting: ${completed}/${selected.length}`)
      }
    }

    for (let i = 0; i < selected.length; i += CONCURRENT_REQUESTS) {
      const batch = selected.slice(i, i + CONCURRENT_REQUESTS)
      await Promise.all(batch.map((meme) => deleteMeme(meme)))
    }

    setMemes((prev) => prev.filter((m) => !m.selected))
    setProgress(`✓ Successfully deleted ${succeeded} memes${failed > 0 ? ` (${failed} failed)` : ""}`)
    setProcessing(false)
  }

  const findDuplicates = () => {
    setProcessing(true)
    setProgress("Scanning for duplicates...")

    const urlMap = new Map<string, Meme[]>()

    memes.forEach((meme) => {
      const url = meme.image_url
      if (!urlMap.has(url)) {
        urlMap.set(url, [])
      }
      urlMap.get(url)!.push(meme)
    })

    const duplicates = Array.from(urlMap.values()).filter((group) => group.length > 1)

    setDuplicateGroups(duplicates)
    setProgress(
      `Found ${duplicates.length} groups of duplicates (${duplicates.reduce((sum, g) => sum + g.length, 0)} total memes)`,
    )
    setProcessing(false)

    if (duplicates.length > 0) {
      setShowDuplicates(true)
    } else {
      setTimeout(() => setProgress(""), 3000)
    }
  }

  const mergeDuplicates = async (group: Meme[], keepId: string) => {
    const toDelete = group.filter((m) => m.id !== keepId)

    setProgress(`Merging ${toDelete.length} duplicates...`)

    let completed = 0
    for (const meme of toDelete) {
      try {
        await fetch("/api/admin/delete-meme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memeId: meme.id }),
        })
        completed++
      } catch (error) {
        console.error("Error deleting duplicate:", error)
      }
    }

    setMemes((prev) => prev.filter((m) => !toDelete.some((d) => d.id === m.id)))

    setDuplicateGroups((prev) => prev.filter((g) => g !== group))

    setProgress(`✓ Merged ${completed} duplicates`)
    setTimeout(() => setProgress(""), 2000)
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

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Bulk Operations</h1>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Input
              placeholder="Search by verdict or claim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
              <Button onClick={findDuplicates} disabled={processing} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                De-duplication
              </Button>
              <Button
                onClick={reanalyzeSelected}
                disabled={processing || !memes.some((m) => m.selected)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-analyze ({memes.filter((m) => m.selected).length})
              </Button>
              <Button
                onClick={deleteSelected}
                disabled={processing || !memes.some((m) => m.selected)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({memes.filter((m) => m.selected).length})
              </Button>
            </div>
          </div>
        </Card>

        {progress && (
          <Card className="p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">{progress}</p>
            {processing && <Progress value={progressPercent} className="h-2" />}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemes.map((meme) => (
            <Card key={meme.id} className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <Checkbox checked={meme.selected} onCheckedChange={() => toggleMeme(meme.id)} />
                <Badge>{meme.verdict}</Badge>
              </div>
              <div className="relative w-full h-48 mb-2">
                <Image src={meme.image_url || "/placeholder.svg"} alt="Meme" fill className="object-cover rounded" />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(meme.created_at).toLocaleDateString()} • {meme.claims?.length || 0} claims
              </p>
            </Card>
          ))}
        </div>

        {filteredMemes.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No memes found</p>
          </Card>
        )}
      </main>

      <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Duplicate Memes Found</DialogTitle>
            <DialogDescription>
              Found {duplicateGroups.length} groups of duplicate memes. Select which one to keep in each group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {duplicateGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="p-6 bg-white">
                <h3 className="font-semibold text-lg mb-4">
                  Duplicate Group {groupIndex + 1} ({group.length} memes)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.map((meme) => (
                    <Card key={meme.id} className="p-4 bg-white hover:border-primary transition-colors">
                      <div className="relative w-full h-64 mb-3 bg-muted rounded-lg overflow-hidden">
                        <Image src={meme.image_url || "/placeholder.svg"} alt="Meme" fill className="object-contain" />
                      </div>
                      <div className="space-y-2">
                        <Badge className="text-sm">{meme.verdict}</Badge>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(meme.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Claims: {meme.claims?.length || 0}</p>
                        <Button size="default" onClick={() => mergeDuplicates(group, meme.id)} className="w-full mt-3">
                          Keep This One
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}

            {duplicateGroups.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No more duplicates found. All duplicates have been resolved!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
