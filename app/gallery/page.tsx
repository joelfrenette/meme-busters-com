import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { GalleryFilters } from "@/components/gallery-filters"

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

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string }
}) {
  const supabase = await createClient()
  const filter = searchParams.filter as Verdict | undefined
  const currentPage = Number.parseInt(searchParams.page || "1", 10)
  const memesPerPage = 9 // Reduced from 10 to 9 memes per page for faster loading
  const offset = (currentPage - 1) * memesPerPage

  console.log("[v0] Gallery page - filter:", filter, "page:", currentPage, "offset:", offset)

  let countQuery = supabase.from("meme_analyses").select("*", { count: "exact", head: true })

  if (filter && filter !== "ALL") {
    countQuery = countQuery.eq("verdict", filter)
  }

  const { count: totalMemes } = await countQuery

  let query = supabase
    .from("meme_analyses")
    .select("id, image_url, verdict, analyzed_at, claims")
    .order("analyzed_at", { ascending: false })
    .range(offset, offset + memesPerPage - 1)

  if (filter && filter !== "ALL") {
    console.log("[v0] Applying filter:", filter)
    query = query.eq("verdict", filter)
  }

  const { data: galleryItems, error } = await query

  if (error) {
    console.error("[v0] Gallery query error:", error)
  }

  const totalPages = totalMemes ? Math.ceil(totalMemes / memesPerPage) : 0

  console.log("[v0] Gallery loaded", galleryItems?.length || 0, "memes (page", currentPage, "of", totalPages, ")")
  if (galleryItems && galleryItems.length > 0) {
    const verdicts = galleryItems.map((item) => item.verdict)
    console.log("[v0] Available verdicts in database:", [...new Set(verdicts)])
  }

  const getVerdictClass = (verdict: string) => {
    const v = verdict.toUpperCase()
    switch (v) {
      case "FACTUAL":
        return "bg-green-500 text-white border-0 font-semibold"
      case "MISLEADING":
        return "bg-yellow-500 text-white border-0 font-semibold"
      case "OUT_OF_CONTEXT":
        return "bg-amber-500 text-white border-0 font-semibold"
      case "DISTORTED":
        return "bg-orange-500 text-white border-0 font-semibold"
      case "MISINFORMATION":
        return "bg-red-400 text-white border-0 font-semibold"
      case "LIES":
        return "bg-red-600 text-white border-0 font-semibold"
      case "UNVERIFIABLE":
        return "bg-gray-500 text-white border-0 font-semibold"
      case "SARCASM":
        return "bg-purple-500 text-white border-0 font-semibold"
      case "SATIRE":
        return "bg-purple-600 text-white border-0 font-semibold"
      case "HUMOR":
        return "bg-blue-500 text-white border-0 font-semibold"
      case "WHOLESOME":
        return "bg-teal-500 text-white border-0 font-semibold"
      case "DARK_HUMOR":
        return "bg-gray-700 text-white border-0 font-semibold"
      default:
        return "bg-gray-500 text-white border-0 font-semibold"
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

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (filter && filter !== "ALL") params.set("filter", filter)
    params.set("page", page.toString())
    return `/gallery?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Pagination */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meme Gallery</h1>
            <p className="text-gray-600">Browse all fact-checked memes</p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="border-gray-300 bg-transparent"
              >
                {currentPage === 1 ? (
                  <span className="cursor-not-allowed opacity-50">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </span>
                ) : (
                  <Link href={buildPageUrl(currentPage - 1)} prefetch={true}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                )}
              </Button>

              <span className="text-sm text-gray-600 whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                className="border-gray-300 bg-transparent"
              >
                {currentPage === totalPages ? (
                  <span className="cursor-not-allowed opacity-50">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                ) : (
                  <Link href={buildPageUrl(currentPage + 1)} prefetch={true}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <GalleryFilters currentFilter={filter} />

        {/* Gallery Grid */}
        {!galleryItems || galleryItems.length === 0 ? (
          <Card className="p-12 text-center border-gray-200">
            <div className="space-y-4">
              <p className="text-lg text-gray-600">
                {filter ? "No memes found with this filter" : "No memes analyzed yet"}
              </p>
              <Button asChild className="bg-[rgb(0,132,255)] hover:bg-[rgb(0,112,235)]">
                <Link href="/analyze">Analyze Your First Meme</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all border-gray-200 bg-white">
                <Link href={`/results/${item.id}`} prefetch={true}>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <Image
                      src={item.image_url || "/placeholder.svg"}
                      alt="Analyzed meme"
                      fill
                      className="object-contain"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={getVerdictClass(item.verdict)}>{item.verdict}</Badge>
                    </div>
                  </div>
                </Link>
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button className="flex items-center gap-1 hover:text-[rgb(0,132,255)] transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{Array.isArray(item.claims) ? item.claims.length : 0}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-[rgb(0,132,255)] transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-[rgb(0,132,255)] transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <span className="ml-auto text-xs">{formatTimeAgo(item.analyzed_at)}</span>
                  </div>
                  <Button asChild size="sm" className="w-full bg-[rgb(0,132,255)] hover:bg-[rgb(0,112,235)]">
                    <Link href={`/results/${item.id}`} prefetch={true}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Analysis
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
