import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { FetchMemesClient } from "@/components/fetch-memes-client"

export default async function FetchMemesPage() {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    redirect("/admin/login")
  }

  return <FetchMemesClient />
}
