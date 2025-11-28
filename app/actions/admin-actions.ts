"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { revalidatePath } from "next/cache"

export async function updateMemeAnalysis(
  id: string,
  data: {
    verdict?: string
    claims?: any[]
    sources?: string[]
  },
) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("meme_analyses").update(data).eq("id", id)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/gallery")
    revalidatePath("/")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating meme:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteMemeAnalysis(id: string) {
  console.log("[v0] Delete action called for ID:", id)

  const isAdmin = await isAdminAuthenticated()
  console.log("[v0] Admin authenticated:", isAdmin)

  if (!isAdmin) {
    console.error("[v0] Unauthorized delete attempt")
    return { success: false, error: "Unauthorized - Admin authentication required" }
  }

  try {
    console.log("[v0] Creating admin Supabase client with service role key...")
    const supabase = createAdminClient()

    console.log("[v0] Checking if meme exists...")
    const { data: existingMeme, error: fetchError } = await supabase
      .from("meme_analyses")
      .select("id")
      .eq("id", id)
      .single()

    console.log("[v0] Existing meme check:", { existingMeme, fetchError })

    if (fetchError || !existingMeme) {
      console.error("[v0] Meme not found in database")
      return { success: false, error: "Meme not found in database" }
    }

    console.log("[v0] Meme exists, proceeding with delete for ID:", id)
    const { data, error } = await supabase.from("meme_analyses").delete().eq("id", id).select()

    console.log("[v0] Delete query result:", { data, error, dataLength: data?.length })

    if (error) {
      console.error("[v0] Database delete error:", error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
      }
    }

    if (!data || data.length === 0) {
      console.error("[v0] No rows deleted")
      return {
        success: false,
        error: "Failed to delete meme from database",
      }
    }

    console.log("[v0] Meme deleted successfully, revalidating paths...")

    revalidatePath("/admin", "page")
    revalidatePath("/gallery", "page")
    revalidatePath("/", "page")

    console.log("[v0] Paths revalidated successfully")

    return { success: true, message: "Meme deleted successfully" }
  } catch (error: any) {
    console.error("[v0] Unexpected error deleting meme:", error)
    return { success: false, error: `Unexpected error: ${error.message}` }
  }
}
