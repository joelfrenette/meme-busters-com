import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { memeId } = await request.json()

    const supabase = createAdminClient()
    const { error } = await supabase.from("meme_analyses").delete().eq("id", memeId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting meme:", error)
    return NextResponse.json({ success: false, error: "Failed to delete meme" }, { status: 500 })
  }
}
