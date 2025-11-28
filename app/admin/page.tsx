import { redirect } from "next/navigation"
import { isAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AdminMemeList } from "@/components/admin-meme-list"
import { Shield, LogOut, Download, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    redirect("/admin/login")
  }

  const params = await searchParams
  const currentPage = Number.parseInt(params.page || "1", 10)
  const memesPerPage = 10
  const offset = (currentPage - 1) * memesPerPage

  const supabase = await createClient()

  console.log(`[v0] Admin page loading, page ${currentPage}, offset ${offset}`)

  const { count: totalCount, error: countError } = await supabase
    .from("meme_analyses")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error(`[v0] Count query error:`, countError)
  }

  const totalPages = Math.ceil((totalCount || 0) / memesPerPage)

  console.log(`[v0] Total memes: ${totalCount}, Total pages: ${totalPages}, Current page: ${currentPage}`)

  const { data: memes, error } = await supabase
    .from("meme_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + memesPerPage - 1)
    .abortSignal(AbortSignal.timeout(15000)) // Increased from 10s to 15s

  console.log(`[v0] Loaded ${memes?.length || 0} memes for page ${currentPage}`)

  if (error) {
    console.error(`[v0] Database error:`, error)
  }

  const validMemes = memes?.filter((meme) => meme && meme.id) || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/fetch-memes">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Fetch Memes
              </Button>
            </Link>
            <Link href="/admin/bulk-operations">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Bulk Operations
              </Button>
            </Link>
            <form action={logoutAdmin}>
              <Button variant="outline" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Manage Memes</h2>
            <p className="text-muted-foreground">Edit or delete analyzed memes. Total: {totalCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Showing page {currentPage} of {totalPages} ({validMemes.length} memes)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={`/admin?page=${currentPage - 1}`} prefetch={true}>
                <Button variant="outline">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}

            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link href={`/admin?page=${currentPage + 1}`} prefetch={true}>
                <Button variant="outline">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              <p className="font-semibold">Failed to load memes: {error.message}</p>
              {error.details && <p className="mt-2 text-sm">Details: {error.details}</p>}
              {(error.message?.includes("timeout") || error.message?.includes("canceling statement")) && (
                <div className="mt-3 space-y-2">
                  <p className="font-semibold">This is a timeout error. Try:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Refresh the page to retry</li>
                    <li>Check your internet connection</li>
                    <li>Contact support if this persists</li>
                  </ul>
                </div>
              )}
              {!error.message?.includes("timeout") && (
                <p className="mt-2 text-sm">
                  This might be a connection issue or RLS policy problem. Check your Supabase connection in production.
                </p>
              )}
            </AlertDescription>
          </Alert>
        ) : totalCount === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Memes Found</AlertTitle>
            <AlertDescription>
              Your production database appears to be empty. This is normal if you haven't analyzed any memes yet in
              production.
              <div className="mt-2">
                <strong>To add memes:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>Go to "Analyze Meme" to analyze individual memes</li>
                  <li>Or use "Fetch Memes" to import memes from Reddit</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <AdminMemeList memes={validMemes} />
        )}
      </main>
    </div>
  )
}
