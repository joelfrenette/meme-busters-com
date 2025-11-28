"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

type Verdict =
  | "FACTUAL"
  | "MISLEADING"
  | "OUT_OF_CONTEXT"
  | "DISTORTED"
  | "MISINFORMATION"
  | "LIES"
  | "UNVERIFIABLE"
  | "SARCASM"
  | "SATIRE"
  | "HUMOR"
  | "WHOLESOME"
  | "DARK_HUMOR"

interface GalleryFiltersProps {
  currentFilter?: Verdict
}

export function GalleryFilters({ currentFilter }: GalleryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setFilter = (filter: Verdict | "ALL") => {
    console.log("[v0] Filter clicked:", filter)
    const params = new URLSearchParams(searchParams)
    if (filter === "ALL") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    const newUrl = `/gallery?${params.toString()}`
    console.log("[v0] Navigating to:", newUrl)
    router.push(newUrl)
  }

  const selectedFilter = currentFilter || "ALL"
  console.log("[v0] Current selected filter:", selectedFilter)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Truthfulness & Accuracy Section */}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Truthfulness & Accuracy
        </span>
        <Button
          variant={selectedFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
          className={
            selectedFilter === "ALL"
              ? "bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)] text-white"
              : "hover:bg-[rgb(0,188,212)]/10 hover:text-[rgb(0,188,212)] hover:border-[rgb(0,188,212)] transition-colors"
          }
        >
          All
        </Button>
        <Button
          variant={selectedFilter === "FACTUAL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("FACTUAL")}
          className={
            selectedFilter === "FACTUAL"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "hover:bg-green-600/10 hover:text-green-600 hover:border-green-600 transition-colors"
          }
        >
          Factual
        </Button>
        <Button
          variant={selectedFilter === "MISLEADING" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("MISLEADING")}
          className={
            selectedFilter === "MISLEADING"
              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
              : "hover:bg-yellow-600/10 hover:text-yellow-600 hover:border-yellow-600 transition-colors"
          }
        >
          Misleading
        </Button>
        <Button
          variant={selectedFilter === "OUT_OF_CONTEXT" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("OUT_OF_CONTEXT")}
          className={
            selectedFilter === "OUT_OF_CONTEXT"
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "hover:bg-amber-600/10 hover:text-amber-600 hover:border-amber-600 transition-colors"
          }
        >
          Out of Context
        </Button>
        <Button
          variant={selectedFilter === "DISTORTED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("DISTORTED")}
          className={
            selectedFilter === "DISTORTED"
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-colors"
          }
        >
          Distorted
        </Button>
        <Button
          variant={selectedFilter === "MISINFORMATION" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("MISINFORMATION")}
          className={
            selectedFilter === "MISINFORMATION"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors"
          }
        >
          Misinformation
        </Button>
        <Button
          variant={selectedFilter === "LIES" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("LIES")}
          className={
            selectedFilter === "LIES"
              ? "bg-red-700 hover:bg-red-800 text-white"
              : "hover:bg-red-700/10 hover:text-red-700 hover:border-red-700 transition-colors"
          }
        >
          Lies
        </Button>
        <Button
          variant={selectedFilter === "UNVERIFIABLE" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("UNVERIFIABLE")}
          className={
            selectedFilter === "UNVERIFIABLE"
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "hover:bg-gray-600/10 hover:text-gray-600 hover:border-gray-600 transition-colors"
          }
        >
          Unverifiable
        </Button>

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-2" />

        {/* Tone & Style Section */}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tone & Style</span>
        <Button
          variant={selectedFilter === "HUMOR" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("HUMOR")}
          className={
            selectedFilter === "HUMOR"
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500 transition-colors"
          }
        >
          Humor
        </Button>
        <Button
          variant={selectedFilter === "SARCASM" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("SARCASM")}
          className={
            selectedFilter === "SARCASM"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "hover:bg-indigo-600/10 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
          }
        >
          Sarcasm
        </Button>
        <Button
          variant={selectedFilter === "SATIRE" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("SATIRE")}
          className={
            selectedFilter === "SATIRE"
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "hover:bg-purple-600/10 hover:text-purple-600 hover:border-purple-600 transition-colors"
          }
        >
          Satire
        </Button>
        <Button
          variant={selectedFilter === "WHOLESOME" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("WHOLESOME")}
          className={
            selectedFilter === "WHOLESOME"
              ? "bg-pink-600 hover:bg-pink-700 text-white"
              : "hover:bg-pink-600/10 hover:text-pink-600 hover:border-pink-600 transition-colors"
          }
        >
          Wholesome
        </Button>
        <Button
          variant={selectedFilter === "DARK_HUMOR" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("DARK_HUMOR")}
          className={
            selectedFilter === "DARK_HUMOR"
              ? "bg-gray-700 hover:bg-gray-800 text-white"
              : "hover:bg-gray-700/10 hover:text-gray-700 hover:border-gray-700 transition-colors"
          }
        >
          Dark Humor
        </Button>
      </div>
    </div>
  )
}
