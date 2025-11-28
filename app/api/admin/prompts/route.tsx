import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { DEFAULT_PROMPT, DEFAULT_MEME_RECOGNITION_PROMPT } from "@/lib/default-prompt"

export async function GET() {
  try {
    console.log("[v0] GET /api/admin/prompts - Starting")

    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      console.log("[v0] GET /api/admin/prompts - Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] GET /api/admin/prompts - Admin authenticated")

    const supabase = createAdminClient()
    console.log("[v0] GET /api/admin/prompts - Supabase client created")

    // Try to fetch prompts from database
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("[v0] GET /api/admin/prompts - Query result:", {
      hasData: !!prompts,
      dataLength: prompts?.length,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
    })

    // If table doesn't exist, return default prompts
    if (error) {
      console.log("[v0] Prompts table doesn't exist, returning defaults")

      const defaultPrompts = [
        {
          id: "default-recognition",
          name: DEFAULT_MEME_RECOGNITION_PROMPT.name,
          version_name: DEFAULT_MEME_RECOGNITION_PROMPT.version_name,
          version_number: 1,
          description: DEFAULT_MEME_RECOGNITION_PROMPT.description,
          prompt_text: DEFAULT_MEME_RECOGNITION_PROMPT.prompt_text,
          is_active: true,
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "default-analysis",
          name: DEFAULT_PROMPT.name,
          version_name: DEFAULT_PROMPT.version_name,
          version_number: 1,
          description: DEFAULT_PROMPT.description,
          prompt_text: DEFAULT_PROMPT.prompt_text,
          is_active: true,
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      console.log(
        "[v0] Returning default prompts:",
        defaultPrompts.map((p) => ({ id: p.id, name: p.name })),
      )

      return NextResponse.json({
        prompts: defaultPrompts,
        needsInitialization: true,
      })
    }

    // Return prompts from database
    console.log("[v0] Returning prompts from database:", prompts?.length || 0)
    return NextResponse.json({
      prompts: prompts || [],
      needsInitialization: false,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/admin/prompts:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Failed to fetch prompts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { error: tableCheckError } = await supabase.from("prompts").select("id").limit(1)

    if (tableCheckError) {
      console.error("[v0] Prompts table doesn't exist:", tableCheckError)
      return NextResponse.json(
        {
          error: "Database table not found",
          message: "The 'prompts' table doesn't exist yet. Please run the SQL script in your Supabase dashboard.",
        },
        { status: 400 },
      )
    }

    const prompts = [
      {
        name: DEFAULT_MEME_RECOGNITION_PROMPT.name,
        version_name: DEFAULT_MEME_RECOGNITION_PROMPT.version_name,
        version_number: 1,
        description: DEFAULT_MEME_RECOGNITION_PROMPT.description,
        prompt_text: DEFAULT_MEME_RECOGNITION_PROMPT.prompt_text,
        is_active: true,
        is_current: true,
      },
      {
        name: DEFAULT_PROMPT.name,
        version_name: DEFAULT_PROMPT.version_name,
        version_number: 1,
        description: DEFAULT_PROMPT.description,
        prompt_text: DEFAULT_PROMPT.prompt_text,
        is_active: true,
        is_current: true,
      },
    ]

    const results = []
    for (const prompt of prompts) {
      const { data, error } = await supabase.from("prompts").insert(prompt).select().single()

      if (error) {
        if (error.code === "23505") {
          console.log(`[v0] Prompt ${prompt.name} already exists, skipping`)
          continue
        }
        throw error
      }
      results.push(data)
    }

    return NextResponse.json({
      success: true,
      message: results.length > 0 ? "Prompts initialized successfully" : "Prompts already exist",
      prompts: results,
    })
  } catch (error) {
    console.error("[v0] Error initializing prompts:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize prompts",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, prompt_text, description, version_name } = body

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("prompts")
      .update({
        prompt_text,
        description,
        version_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, prompt: data })
  } catch (error) {
    console.error("[v0] Error updating prompt:", error)
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
  }
}
