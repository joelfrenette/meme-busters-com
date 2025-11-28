"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteMemeAnalysis } from "@/app/actions/admin-actions"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

interface Meme {
  id: string
  verdict: string
}

export function AdminDeleteDialog({
  meme,
  onClose,
  onDeleted,
}: {
  meme: Meme
  onClose: () => void
  onDeleted?: (id: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("[v0] AdminDeleteDialog: Deleting meme ID:", meme.id)
      const result = await deleteMemeAnalysis(meme.id)

      console.log("[v0] AdminDeleteDialog: Delete result:", result)

      if (result.success) {
        console.log("[v0] AdminDeleteDialog: Delete successful, calling onDeleted callback")
        if (onDeleted) {
          onDeleted(meme.id)
        }
        alert("Meme deleted successfully!")
        onClose()
      } else {
        console.error("[v0] AdminDeleteDialog: Delete failed:", result.error)
        setError(result.error || "Failed to delete")
        alert(`Delete failed: ${result.error}`)
      }
    } catch (err: any) {
      console.error("[v0] AdminDeleteDialog: Delete exception:", err)
      setError(err.message || "An error occurred")
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Meme Analysis
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this meme analysis? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
