"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageSquare, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface FeedbackFormProps {
  memeId: string
}

export function FeedbackForm({ memeId }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<"dispute" | "clarify" | "reanalyze">("clarify")
  const [userContext, setUserContext] = useState("")
  const [culturalContext, setCulturalContext] = useState("")
  const [historicalContext, setHistoricalContext] = useState("")
  const [additionalSources, setAdditionalSources] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmitFeedback = async () => {
    if (!userContext.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your feedback or context",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setStatusMessage("Submitting your feedback...")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memeId,
          feedbackType,
          userContext,
          culturalContext,
          historicalContext,
          additionalSources,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503 && data.code === "TABLE_NOT_FOUND") {
          toast({
            title: "Feature Not Available",
            description: "The feedback feature is not yet configured. Please contact the site administrator.",
            variant: "destructive",
          })
          setStatusMessage("")
          return
        }

        throw new Error(data.error || "Failed to submit feedback")
      }

      if (data.reanalyzed) {
        setStatusMessage("Re-analyzing meme with your feedback...")

        toast({
          title: "Re-analysis Complete!",
          description: "The meme has been re-analyzed with your feedback. Refreshing page...",
          duration: 3000,
        })

        setTimeout(() => {
          router.refresh()
          setStatusMessage("")
        }, 2000)
      } else {
        toast({
          title: "Feedback Submitted",
          description: data.evaluationReasoning || "Thank you for your feedback!",
        })
        setStatusMessage("")
      }

      // Clear form
      setUserContext("")
      setCulturalContext("")
      setHistoricalContext("")
      setAdditionalSources("")
    } catch (error) {
      console.error("[v0] Error submitting feedback:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
      setStatusMessage("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provide Feedback
          </h3>
          <p className="text-sm text-muted-foreground">
            Help us improve this analysis by providing cultural, historical, or contextual information. If your feedback
            adds value, we'll automatically re-analyze the meme with your insights.
          </p>
        </div>

        {statusMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">{statusMessage}</p>
              <p className="text-sm text-blue-700">This may take a moment...</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Feedback Type</Label>
            <RadioGroup value={feedbackType} onValueChange={(value: any) => setFeedbackType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clarify" id="clarify" />
                <Label htmlFor="clarify" className="font-normal cursor-pointer">
                  Clarify - Provide additional context or information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dispute" id="dispute" />
                <Label htmlFor="dispute" className="font-normal cursor-pointer">
                  Dispute - Challenge the analysis with evidence
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reanalyze" id="reanalyze" />
                <Label htmlFor="reanalyze" className="font-normal cursor-pointer">
                  Request Re-analysis - Get a new analysis with your context
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userContext">Your Feedback *</Label>
            <Textarea
              id="userContext"
              placeholder="Explain what the AI might have missed or misunderstood..."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="culturalContext">Cultural Context (Optional)</Label>
            <Textarea
              id="culturalContext"
              placeholder="Explain cultural references, slang, or community-specific meanings..."
              value={culturalContext}
              onChange={(e) => setCulturalContext(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="historicalContext">Historical Context (Optional)</Label>
            <Textarea
              id="historicalContext"
              placeholder="Provide historical background or events related to this meme..."
              value={historicalContext}
              onChange={(e) => setHistoricalContext(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalSources">Additional Sources (Optional)</Label>
            <Textarea
              id="additionalSources"
              placeholder="Paste URLs or references to support your feedback..."
              value={additionalSources}
              onChange={(e) => setAdditionalSources(e.target.value)}
              rows={2}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting || !userContext.trim()}
          className="w-full bg-[#0084FF] hover:bg-[#0073E6] text-white"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
