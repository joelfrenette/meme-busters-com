"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Trash2, ExternalLink } from "lucide-react"

type Verdict = "factual" | "dishonest" | "liar"

interface HistoryItem {
  id: string
  imageUrl: string
  verdict: Verdict
  confidence: number
  analyzedAt: string
  claimsCount: number
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock history data
  const historyItems: HistoryItem[] = [
    {
      id: "abc123",
      imageUrl: "/political-meme.jpg",
      verdict: "liar",
      confidence: 92,
      analyzedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      claimsCount: 3,
    },
    {
      id: "def456",
      imageUrl: "/health-meme.jpg",
      verdict: "factual",
      confidence: 88,
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      claimsCount: 2,
    },
    {
      id: "ghi789",
      imageUrl: "/science-meme.jpg",
      verdict: "dishonest",
      confidence: 85,
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      claimsCount: 4,
    },
    {
      id: "jkl012",
      imageUrl: "/news-meme.jpg",
      verdict: "factual",
      confidence: 91,
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      claimsCount: 1,
    },
  ]

  const getVerdictLabel = (verdict: Verdict) => {
    switch (verdict) {
      case "factual":
        return "FACTUAL"
      case "dishonest":
        return "MISLEADING"
      case "liar":
        return "FALSE"
    }
  }

  const getVerdictClass = (verdict: Verdict) => {
    switch (verdict) {
      case "factual":
        return "verdict-factual"
      case "dishonest":
        return "verdict-dishonest"
      case "liar":
        return "verdict-liar"
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
          <p className="text-muted-foreground">View all your previous fact-checks</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* History List */}
        {historyItems.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">No analysis history yet</p>
              <Button asChild>
                <Link href="/analyze">Analyze Your First Meme</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <Card key={item.id} className="p-4 hover:border-primary transition-colors">
                <div className="flex gap-4">
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.imageUrl || "/placeholder.svg"} alt="Meme" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getVerdictClass(item.verdict)}>{getVerdictLabel(item.verdict)}</Badge>
                      <span className="text-sm text-muted-foreground">{item.confidence}% confidence</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{item.claimsCount} claims</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatTimeAgo(item.analyzedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/results/${item.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
