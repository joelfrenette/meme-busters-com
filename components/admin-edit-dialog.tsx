"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateMemeAnalysis, deleteMemeAnalysis } from "@/app/actions/admin-actions"
import { useRouter } from "next/navigation"
import { Trash2, Plus, X, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatConfidence } from "@/lib/format-confidence"

interface Claim {
  text: string
  sources: Array<{ url: string; title: string; publisher: string }>
  verdict: string
  confidence: number
  explanation: string
}

interface Meme {
  id: string
  verdict: string
  claims: Claim[]
  sources: string[]
}

export function AdminEditDialog({
  meme,
  onClose,
  onDeleted,
  onUpdated,
}: {
  meme: Meme
  onClose: () => void
  onDeleted?: (id: string) => void
  onUpdated?: (meme: Meme) => void
}) {
  const router = useRouter()
  const [verdict, setVerdict] = useState(meme.verdict)
  const [claims, setClaims] = useState<Claim[]>(Array.isArray(meme.claims) ? meme.claims : [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateClaim = (index: number, field: keyof Claim, value: any) => {
    const newClaims = [...claims]
    newClaims[index] = { ...newClaims[index], [field]: value }
    setClaims(newClaims)
  }

  const addSource = (claimIndex: number) => {
    const newClaims = [...claims]
    if (!newClaims[claimIndex].sources) {
      newClaims[claimIndex].sources = []
    }
    newClaims[claimIndex].sources.push({ url: "", title: "", publisher: "" })
    setClaims(newClaims)
  }

  const removeSource = (claimIndex: number, sourceIndex: number) => {
    const newClaims = [...claims]
    newClaims[claimIndex].sources.splice(sourceIndex, 1)
    setClaims(newClaims)
  }

  const updateSource = (claimIndex: number, sourceIndex: number, field: string, value: string) => {
    const newClaims = [...claims]
    newClaims[claimIndex].sources[sourceIndex] = {
      ...newClaims[claimIndex].sources[sourceIndex],
      [field]: value,
    }
    setClaims(newClaims)
  }

  const removeClaim = (index: number) => {
    const newClaims = claims.filter((_, i) => i !== index)
    setClaims(newClaims)
  }

  const addClaim = () => {
    setClaims([
      ...claims,
      {
        text: "",
        sources: [],
        verdict: "factual",
        confidence: 50,
        explanation: "",
      },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await updateMemeAnalysis(meme.id, {
        verdict,
        claims,
        sources: [], // Sources are now embedded in claims
      })

      if (result.success) {
        if (onUpdated) {
          onUpdated({ ...meme, verdict, claims, sources: [] })
        }
        router.refresh()
        onClose()
      } else {
        setError(result.error || "Failed to update")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Calling delete action for meme ID:", meme.id)
      const result = await deleteMemeAnalysis(meme.id)

      console.log("[v0] Delete result:", result)

      if (result.success) {
        console.log("[v0] Delete successful, calling onDeleted callback")
        if (onDeleted) {
          onDeleted(meme.id)
        }
        alert("Meme deleted successfully!")
        onClose()
      } else {
        console.error("[v0] Delete failed:", result.error)
        setError(result.error || "Failed to delete meme")
        setShowDeleteConfirm(false)
        alert(`Delete failed: ${result.error}`)
      }
    } catch (err: any) {
      console.error("[v0] Delete exception:", err)
      setError(err.message || "An error occurred")
      setShowDeleteConfirm(false)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
            <span>Edit Meme Analysis</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Meme
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verdict" className="text-sm font-semibold text-gray-700">
              Overall Verdict
            </Label>
            <Select value={verdict} onValueChange={setVerdict}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="FACTUAL">FACTUAL</SelectItem>
                <SelectItem value="MISLEADING">MISLEADING</SelectItem>
                <SelectItem value="OUT_OF_CONTEXT">OUT OF CONTEXT</SelectItem>
                <SelectItem value="DISTORTED">DISTORTED</SelectItem>
                <SelectItem value="MISINFORMATION">MISINFORMATION</SelectItem>
                <SelectItem value="LIES">LIES</SelectItem>
                <SelectItem value="UNVERIFIABLE">UNVERIFIABLE</SelectItem>
                <SelectItem value="SARCASM">SARCASM</SelectItem>
                <SelectItem value="SATIRE">SATIRE</SelectItem>
                <SelectItem value="HUMOR">HUMOR</SelectItem>
                <SelectItem value="WHOLESOME">WHOLESOME</SelectItem>
                <SelectItem value="DARK_HUMOR">DARK_HUMOR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-gray-900">Claims</Label>
              <Button type="button" onClick={addClaim} size="sm" variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Claim
              </Button>
            </div>

            {claims.map((claim, claimIndex) => (
              <Card key={claimIndex} className="p-4 space-y-4 border-2 border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">Claim {claimIndex + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClaim(claimIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Claim Text</Label>
                  <Textarea
                    value={claim.text}
                    onChange={(e) => updateClaim(claimIndex, "text", e.target.value)}
                    rows={2}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Verdict</Label>
                    <Select value={claim.verdict} onValueChange={(value) => updateClaim(claimIndex, "verdict", value)}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="factual">Factual</SelectItem>
                        <SelectItem value="misleading">Misleading</SelectItem>
                        <SelectItem value="out_of_context">Out of Context</SelectItem>
                        <SelectItem value="distorted">Distorted</SelectItem>
                        <SelectItem value="misinformation">Misinformation</SelectItem>
                        <SelectItem value="lies">Lies</SelectItem>
                        <SelectItem value="unverifiable">Unverifiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Confidence ({formatConfidence(claim.confidence)}%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formatConfidence(claim.confidence)}
                      onChange={(e) => updateClaim(claimIndex, "confidence", Number.parseInt(e.target.value))}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Explanation</Label>
                  <Textarea
                    value={claim.explanation}
                    onChange={(e) => updateClaim(claimIndex, "explanation", e.target.value)}
                    rows={3}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700">Sources</Label>
                    <Button
                      type="button"
                      onClick={() => addSource(claimIndex)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Add Source
                    </Button>
                  </div>

                  {claim.sources?.map((source, sourceIndex) => (
                    <div key={sourceIndex} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Source {sourceIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSource(claimIndex, sourceIndex)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <Input
                        placeholder="URL"
                        value={source.url}
                        onChange={(e) => updateSource(claimIndex, sourceIndex, "url", e.target.value)}
                        className="bg-white border-gray-300 text-sm"
                      />
                      <Input
                        placeholder="Title"
                        value={source.title}
                        onChange={(e) => updateSource(claimIndex, sourceIndex, "title", e.target.value)}
                        className="bg-white border-gray-300 text-sm"
                      />
                      <Input
                        placeholder="Publisher"
                        value={source.publisher}
                        onChange={(e) => updateSource(claimIndex, sourceIndex, "publisher", e.target.value)}
                        className="bg-white border-gray-300 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</p>}

          {showDeleteConfirm ? (
            <div className="bg-red-50 border-4 border-red-500 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-red-900">Confirm Deletion</h3>
                  <p className="text-red-800 font-semibold">
                    Are you sure you want to delete this meme analysis? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-gray-400 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-base px-8 py-2 h-auto"
                >
                  {loading ? "Deleting..." : "CONFIRM DELETION"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                DELETE
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 bg-transparent">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
