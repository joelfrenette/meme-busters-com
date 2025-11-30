import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callXAI, getApiKey } from "@/lib/xai-client"
import { z } from "zod"

const feedbackEvaluationSchema = z.object({
  isValid: z.boolean().describe("Whether the feedback is valid and constructive"),
  addsValue: z.boolean().describe("Whether the feedback adds meaningful context or information"),
  shouldReanalyze: z.boolean().describe("Whether the meme should be re-analyzed with this feedback"),
  reasoning: z.string().describe("Brief explanation of the evaluation"),
})

function extractJSON(text: string): unknown {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim())
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error("No JSON found in response")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memeId, feedbackType, userContext, culturalContext, historicalContext, additionalSources } = body

    console.log("[v0] Submitting feedback for meme:", memeId)

    if (!memeId || !feedbackType || !userContext) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from("meme_feedback")
      .insert({
        meme_id: memeId,
        feedback_type: feedbackType,
        user_context: userContext,
        cultural_context: culturalContext,
        historical_context: historicalContext,
        additional_sources: additionalSources,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error inserting feedback:", error.message)

      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        return NextResponse.json(
          {
            error:
              "Feedback feature is not yet set up. Please contact the administrator to run the database setup script.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Feedback submitted successfully:", feedback.id)

    let shouldReanalyze = false
    let evaluationReasoning = ""

    try {
      const apiKey = getApiKey()
      if (!apiKey) {
        console.warn("[v0] Grok API key not configured, skipping AI evaluation")
        shouldReanalyze = feedbackType === "reanalyze"
      } else {
        console.log("[v0] Evaluating feedback with Grok API...")

        const feedbackContext = `
Feedback Type: ${feedbackType}
User Context: ${userContext}
${culturalContext ? `Cultural Context: ${culturalContext}` : ""}
${historicalContext ? `Historical Context: ${historicalContext}` : ""}
${additionalSources ? `Additional Sources: ${additionalSources}` : ""}
        `.trim()

        const prompt = `You are evaluating user feedback on a meme analysis. Determine if this feedback is valid, adds meaningful value, and whether the meme should be re-analyzed with this new context.

Feedback to evaluate:
${feedbackContext}

Consider:
1. Does the feedback provide new, relevant information?
2. Does it add cultural, historical, or contextual insights?
3. Does it challenge the analysis with credible evidence?
4. Is it constructive and specific (not just "I disagree")?
5. Would incorporating this feedback improve the analysis?

Be generous - if the feedback adds ANY meaningful context or perspective, recommend re-analysis.

IMPORTANT: Respond with ONLY a valid JSON object:
{
  "isValid": true or false,
  "addsValue": true or false,
  "shouldReanalyze": true or false,
  "reasoning": "brief explanation"
}`

        const responseText = await callXAI([{ role: "user", content: prompt }], {
          model: "grok-2-latest",
          maxTokens: 500,
          temperature: 0.3,
        })

        const parsed = extractJSON(responseText)
        const evaluation = feedbackEvaluationSchema.parse(parsed)

        shouldReanalyze = evaluation.shouldReanalyze
        evaluationReasoning = evaluation.reasoning

        console.log("[v0] AI Evaluation:", {
          isValid: evaluation.isValid,
          addsValue: evaluation.addsValue,
          shouldReanalyze: evaluation.shouldReanalyze,
          reasoning: evaluation.reasoning,
        })
      }
    } catch (evalError) {
      console.error("[v0] Error evaluating feedback:", evalError)
      // If evaluation fails, default to re-analyzing for "reanalyze" type
      shouldReanalyze = feedbackType === "reanalyze"
    }

    let reanalysisResult = null
    if (shouldReanalyze) {
      console.log("[v0] Feedback deemed valuable, triggering automatic re-analysis...")

      try {
        // Get original meme
        const { data: originalMeme, error: fetchError } = await supabase
          .from("meme_analyses")
          .select("*")
          .eq("id", memeId)
          .single()

        if (!fetchError && originalMeme) {
          const { performAnalysis } = await import("@/app/actions/analyze-meme")

          const additionalContext = `
User Feedback: ${userContext}
${culturalContext ? `Cultural Context: ${culturalContext}` : ""}
${historicalContext ? `Historical Context: ${historicalContext}` : ""}
${additionalSources ? `Additional Sources: ${additionalSources}` : ""}
          `.trim()

          const result = await performAnalysis(originalMeme.image_url, additionalContext)

          await supabase
            .from("meme_analyses")
            .update({
              verdict: result.overallVerdict.toUpperCase(),
              claims: result.claims,
              overall_explanation: result.claims.map((c) => c.explanation).join(" "),
              sources: result.claims.flatMap((c) => c.sources),
              updated_at: new Date().toISOString(),
            })
            .eq("id", memeId)

          reanalysisResult = { ...result, id: memeId, analyzedAt: originalMeme.analyzed_at }
          console.log("[v0] Re-analysis complete and meme updated (no duplicate created)")
        }
      } catch (reanalysisError) {
        console.error("[v0] Error during automatic re-analysis:", reanalysisError)
        // Don't fail the feedback submission if re-analysis fails
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      reanalyzed: shouldReanalyze,
      evaluationReasoning,
      result: reanalysisResult,
    })
  } catch (error) {
    console.error("[v0] Error in feedback submission:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memeId = searchParams.get("memeId")

    if (!memeId) {
      return NextResponse.json({ error: "Missing memeId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: feedback, error } = await supabase
      .from("meme_feedback")
      .select("*")
      .eq("meme_id", memeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching feedback:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}
