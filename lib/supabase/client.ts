import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key =
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!url || !key) {
    console.error("[v0] Supabase client error - URL:", !!url, "Key:", !!key)
    throw new Error("Supabase URL and Key are required for client")
  }

  return createBrowserClient(url, key)
}
