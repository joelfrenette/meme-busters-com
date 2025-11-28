"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FeedbackForm } from "@/components/feedback-form"
import {
  ArrowLeft,
  Share2,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Smile,
  MessageCircle,
  Skull,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { MemeAnalysisResult } from "@/app/actions/analyze-meme"
import { formatConfidence } from "@/lib/format-confidence"

type Verdict =
  | "factual"
  | "misleading"
  | "out_of_context"
  | "distorted"
  | "misinformation"
  | "lies"
  | "unverifiable"
  | "sarcasm"
  | "satire"
  | "humor"
  | "wholesome"
  | "dark_humor"

interface Claim {
  text: string
  verdict: Verdict
  confidence: number
  sources: Array<{
    title: string
    url: string
    publisher: string
  }>
  explanation: string
}

interface AnalysisResult {
  id: string
  imageUrl: string
  overallVerdict: Verdict
  confidence: number
  claims: Claim[]
  analyzedAt: string
}

export function ResultsView({ resultId }: { resultId: string }) {
  const [result, setResult] = useState<MemeAnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchResults = async () => {
      console.log("[v0] Loading results for ID:", resultId)

      try {
        // Try to get from sessionStorage first
        const storedResult = sessionStorage.getItem(`analysis-${resultId}`)

        if (storedResult) {
          const parsedResult = JSON.parse(storedResult)
          console.log("[v0] Loaded result from storage:", parsedResult)
          setResult(parsedResult)
          setIsLoading(false)
        } else {
          console.log("[v0] No result in storage, fetching from API")

          const response = await fetch(`/api/meme/${resultId}`)

          if (!response.ok) {
            const errorData = await response.json()
            console.error("[v0] API error:", errorData)

            toast({
              title: "Result not found",
              description: errorData.error || "This analysis result could not be found.",
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }

          const { meme } = await response.json()
          console.log("[v0] Loaded result from API:", meme)

          // Transform database result to match expected format
          const transformedResult: MemeAnalysisResult = {
            id: meme.id,
            imageUrl: meme.image_url,
            overallVerdict: meme.verdict,
            confidence: 95, // Default confidence since it's not stored
            claims: Array.isArray(meme.claims) ? meme.claims : [],
            analyzedAt: meme.analyzed_at,
          }

          setResult(transformedResult)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("[v0] Error loading results:", error)
        toast({
          title: "Error loading results",
          description: "Failed to load analysis results. Check console for details.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [resultId, toast])

  const getVerdictConfig = (verdict: Verdict | string) => {
    // Normalize to lowercase for comparison
    const normalizedVerdict = verdict.toLowerCase()

    switch (normalizedVerdict) {
      case "factual":
        return {
          label: "FACTUAL",
          icon: CheckCircle2,
          className: "verdict-factual",
          description: "Claims are completely true and verifiable",
        }
      case "misleading":
        return {
          label: "MISLEADING",
          icon: AlertTriangle,
          className: "verdict-misleading",
          description: "True but missing important context or cherry-picked facts",
        }
      case "out_of_context":
        return {
          label: "OUT OF CONTEXT",
          icon: AlertTriangle,
          className: "verdict-out-of-context",
          description: "True statement used in wrong context to imply something false",
        }
      case "distorted":
        return {
          label: "DISTORTED",
          icon: AlertTriangle,
          className: "verdict-distorted",
          description: "Facts twisted, exaggerated, or misrepresented",
        }
      case "misinformation":
        return {
          label: "MISINFORMATION",
          icon: XCircle,
          className: "verdict-misinformation",
          description: "False information (may not be intentionally deceptive)",
        }
      case "lies":
        return {
          label: "LIES",
          icon: XCircle,
          className: "verdict-liar",
          description: "Intentionally false and deceptive claims",
        }
      case "unverifiable":
        return {
          label: "UNVERIFIABLE",
          icon: AlertTriangle,
          className: "verdict-unverifiable",
          description: "Claims cannot be fact-checked with available sources",
        }
      case "sarcasm":
        return {
          label: "SARCASM",
          icon: MessageCircle,
          className: "verdict-factual",
          description: "Uses irony to mock or convey contempt",
        }
      case "satire":
        return {
          label: "SATIRE",
          icon: Smile,
          className: "verdict-factual",
          description: "Uses humor, irony, or exaggeration to criticize",
        }
      case "humor":
        return {
          label: "HUMOR",
          icon: Smile,
          className: "verdict-factual",
          description: "Intended for entertainment and comedy",
        }
      case "wholesome":
        return {
          label: "WHOLESOME",
          icon: CheckCircle2,
          className: "verdict-factual",
          description: "Positive, uplifting content",
        }
      case "dark_humor":
        return {
          label: "DARK HUMOR",
          icon: Skull,
          className: "verdict-dishonest",
          description: "Uses dark or morbid themes for comedic effect",
        }
      default:
        // Fallback for unknown verdicts
        return {
          label: verdict.toUpperCase(),
          icon: AlertTriangle,
          className: "verdict-dishonest",
          description: "Analysis result",
        }
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "MemeBusters Analysis",
        text: `Check out this fact-check result from MemeBusters`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Share this result with others",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Result not found</p>
          <Button asChild variant="ghost" size="icon">
            <Link href="/analyze">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/analyze">Analyze Another Meme</Link>
          </Button>
        </div>
      </div>
    )
  }

  const verdictConfig = getVerdictConfig(result.overallVerdict)
  const VerdictIcon = verdictConfig.icon

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="icon">
            <Link href="/analyze">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overall Verdict */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={result.imageUrl || "/placeholder.svg"}
                  alt="Analyzed meme"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className={`${verdictConfig.className} text-lg px-4 py-1`}>{verdictConfig.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatConfidence(result.confidence)}% confidence
                  </span>
                </div>
                <p className="text-muted-foreground">{verdictConfig.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <VerdictIcon className="h-4 w-4" />
                <span>Analyzed {new Date(result.analyzedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1 bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)]">
            <Link href="/analyze">Analyze Another Meme</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href="/gallery">View Gallery</Link>
          </Button>
        </div>

        {/* Claims Analysis */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Claims Analysis</h2>
          {result.claims.map((claim, index) => {
            const claimConfig = getVerdictConfig(claim.verdict)
            const ClaimIcon = claimConfig.icon

            return (
              <Card key={index} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <ClaimIcon
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${claim.verdict === "factual" ? "text-[rgb(34,197,94)]" : claim.verdict === "misleading" || claim.verdict === "out_of_context" || claim.verdict === "distorted" ? "text-[rgb(234,179,8)]" : claim.verdict === "misinformation" || claim.verdict === "lies" ? "text-[rgb(239,68,68)]" : "text-[rgb(156,163,175)]"}`}
                    />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-balance">{claim.text}</p>
                      <p className="text-sm text-muted-foreground">{claim.explanation}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={claimConfig.className}>
                          {claimConfig.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatConfidence(claim.confidence)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {claim.sources.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Sources</h4>
                        <div className="space-y-2">
                          {claim.sources.map((source, sourceIndex) => (
                            <a
                              key={sourceIndex}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                            >
                              <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                  {source.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{source.publisher}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Feedback Form */}
        <div className="mt-8">
          <FeedbackForm memeId={resultId} />
        </div>
      </div>
    </div>
  )
}
