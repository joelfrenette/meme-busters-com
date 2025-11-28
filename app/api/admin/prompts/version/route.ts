import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_SUPABASE_URL!, process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, version_name, prompt_text, description, parent_version_id } = body

    // Get the current max version number for this prompt
    const { data: existingVersions } = await supabase
      .from("prompts")
      .select("version_number")
      .eq("name", name)
      .order("version_number", { ascending: false })
      .limit(1)

    const nextVersionNumber =
      existingVersions && existingVersions.length > 0 ? existingVersions[0].version_number + 1 : 1

    // Set all other versions of this prompt to not current
    await supabase.from("prompts").update({ is_current: false }).eq("name", name)

    // Insert new version
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        name,
        version_name,
        version_number: nextVersionNumber,
        prompt_text,
        description,
        parent_version_id,
        is_active: true,
        is_current: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      message: "New version created successfully",
      prompt: data,
    })
  } catch (error) {
    console.error("[v0] Error creating new version:", error)
    return NextResponse.json({ message: "Failed to create new version" }, { status: 500 })
  }
}
