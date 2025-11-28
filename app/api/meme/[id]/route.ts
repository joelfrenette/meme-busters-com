import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const maxDuration = 10

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Fetching meme with ID:", id)

    const supabase = createAdminClient()

    const { data: meme, error } = await supabase.from("meme_analyses").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch meme", details: error.message }, { status: 500 })
    }

    if (!meme) {
      console.log("[v0] Meme not found for ID:", id)
      return NextResponse.json({ error: "Meme not found" }, { status: 404 })
    }

    console.log("[v0] Successfully fetched meme:", meme.id)
    return NextResponse.json({ meme })
  } catch (error) {
    console.error("[v0] Error in meme fetch API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
