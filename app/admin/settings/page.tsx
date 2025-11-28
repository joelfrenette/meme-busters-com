import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { PromptEditor } from "@/components/prompt-editor"

export default async function AdminSettingsPage() {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Prompt Settings</h1>
          <p className="text-gray-400">Fine-tune the AI prompts used for meme recognition and analysis</p>
        </div>

        <PromptEditor />
      </div>
    </div>
  )
}
