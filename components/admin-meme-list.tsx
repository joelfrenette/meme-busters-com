"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { AdminEditDialog } from "./admin-edit-dialog"
import { AdminDeleteDialog } from "./admin-delete-dialog"
import Image from "next/image"

interface Meme {
  id: string
  image_url: string
  verdict: string
  claims: any[]
  sources: string[]
  created_at: string
}

export function AdminMemeList({ memes: initialMemes }: { memes: Meme[] }) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes)
  const [editingMeme, setEditingMeme] = useState<Meme | null>(null)
  const [deletingMeme, setDeletingMeme] = useState<Meme | null>(null)

  useEffect(() => {
    setMemes(initialMemes)
  }, [initialMemes])

  const handleMemeDeleted = (deletedId: string) => {
    console.log("[v0] Removing meme from list:", deletedId)
    setMemes((prevMemes) => prevMemes.filter((meme) => meme.id !== deletedId))
    setDeletingMeme(null)
    setEditingMeme(null)
  }

  const handleMemeUpdated = (updatedMeme: Meme) => {
    console.log("[v0] Updating meme in list:", updatedMeme.id)
    setMemes((prevMemes) => prevMemes.map((meme) => (meme.id === updatedMeme.id ? updatedMeme : meme)))
    setEditingMeme(null)
  }

  return (
    <>
      <div className="grid gap-4">
        {memes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No memes found</p>
          </Card>
        ) : (
          memes.map((meme) => (
            <Card key={meme.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image src={meme.image_url || "/placeholder.svg"} alt="Meme" fill className="object-cover rounded" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-2">{meme.verdict}</Badge>
                      <p className="text-sm text-muted-foreground">{new Date(meme.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingMeme(meme)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeletingMeme(meme)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm">
                    <strong>Claims:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {meme.claims?.slice(0, 2).map((claim: any, idx: number) => (
                        <li key={idx}>{claim.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {editingMeme && (
        <AdminEditDialog
          meme={editingMeme}
          onClose={() => setEditingMeme(null)}
          onDeleted={handleMemeDeleted}
          onUpdated={handleMemeUpdated}
        />
      )}

      {deletingMeme && (
        <AdminDeleteDialog meme={deletingMeme} onClose={() => setDeletingMeme(null)} onDeleted={handleMemeDeleted} />
      )}
    </>
  )
}
