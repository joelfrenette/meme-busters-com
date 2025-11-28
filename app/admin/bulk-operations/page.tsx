import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createClient } from "@/lib/supabase/server"
import { BulkOperationsClient } from "@/components/bulk-operations-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function BulkOperationsPage() {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  console.log("[v0] Bulk operations: Fetching memes from database")

  const QUERY_TIMEOUT = 30000 // 30 seconds
  const MAX_MEMES = 100 // Limit to 100 memes to avoid timeout with large data URLs

  const { data: memes, error } = await supabase
    .from("meme_analyses")
    .select("id, image_url, verdict, claims, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_MEMES)
    .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT))

  console.log("[v0] Bulk operations: Query result", {
    memesCount: memes?.length || 0,
    hasError: !!error,
    errorMessage: error?.message,
    errorDetails: error?.details,
  })

  if (error) {
    const isTimeout = error.message?.includes("timeout") || error.message?.includes("canceling statement")

    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isTimeout ? "Database Timeout" : "Database Error"}</AlertTitle>
          <AlertDescription>
            {isTimeout ? (
              <>
                <p>The database query took too long and was canceled.</p>
                <div className="mt-3 space-y-2">
                  <p className="font-semibold">Possible causes:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Large image data URLs causing slow transfer</li>
                    <li>Slow database connection or high load</li>
                    <li>Too many memes to process at once</li>
                  </ul>
                  <p className="font-semibold mt-3">Try these solutions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Refresh the page to retry</li>
                    <li>Use the main Admin Dashboard with pagination for large operations</li>
                    <li>Process memes in smaller batches</li>
                    <li>Contact support if the issue persists</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>Failed to load memes: {error.message}</p>
                {error.details && <div className="mt-2 text-sm">Details: {error.details}</div>}
                <div className="mt-2 text-sm">
                  This might be a connection issue or RLS policy problem. Check your Supabase connection.
                </div>
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show helpful message if database is empty
  if (!memes || memes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      </div>
    )
  }

  const hitLimit = memes.length === MAX_MEMES

  return (
    <div>
      <div className="container mx-auto px-4 pt-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Bulk Operations - Quick Actions</AlertTitle>
          <AlertDescription>
            <p>
              This page loads the most recent <strong>{MAX_MEMES} memes</strong> for quick bulk operations like
              re-analysis, deletion, and de-duplication.
            </p>
            <p className="mt-2">
              <strong>For larger operations:</strong> Use the main Admin Dashboard which supports pagination and can
              handle thousands of memes efficiently.
            </p>
          </AlertDescription>
        </Alert>
      </div>
      {hitLimit && (
        <div className="container mx-auto px-4 pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Showing Limited Results</AlertTitle>
            <AlertDescription>
              Displaying the most recent {MAX_MEMES} memes. Use the main Admin Dashboard for paginated access to all
              memes.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <BulkOperationsClient memes={memes} />
    </div>
  )
}
