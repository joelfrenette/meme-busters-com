import { type NextRequest, NextResponse } from "next/server"
import { performAnalysis } from "@/app/actions/analyze-meme"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memeId, feedbackId, additionalContext } = body

    console.log("[v0] Re-analyzing meme:", memeId, "with feedback:", feedbackId)

    if (!memeId) {
      return NextResponse.json({ error: "Missing memeId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get original meme
    const { data: originalMeme, error: fetchError } = await supabase
      .from("meme_analyses")
      .select("*")
      .eq("id", memeId)
      .single()

    if (fetchError || !originalMeme) {
      console.error("[v0] Error fetching original meme:", fetchError)
      return NextResponse.json({ error: "Meme not found" }, { status: 404 })
    }

    console.log("[v0] Re-analyzing with additional context:", additionalContext)
    const result = await performAnalysis(originalMeme.image_url, additionalContext)

    const { error: updateError } = await supabase
      .from("meme_analyses")
      .update({
        verdict: result.overallVerdict.toUpperCase(),
        claims: result.claims,
        overall_explanation: result.claims.map((c) => c.explanation).join(" "),
        sources: result.claims.flatMap((c) => c.sources),
        feedback_incorporated: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memeId)

    if (updateError) {
      console.error("[v0] Error updating meme:", updateError)
      return NextResponse.json({ error: "Failed to update analysis" }, { status: 500 })
    }

    // Mark feedback as incorporated
    if (feedbackId) {
      await supabase.from("meme_feedback").update({ status: "incorporated" }).eq("id", feedbackId)
    }

    console.log("[v0] Re-analysis complete (no duplicate created):", memeId)

    return NextResponse.json({ success: true, result: { ...result, id: memeId } })
  } catch (error) {
    console.error("[v0] Error in re-analysis:", error)
    return NextResponse.json({ error: "Failed to re-analyze meme" }, { status: 500 })
  }
}
