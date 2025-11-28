import { UploadForm } from "@/components/upload-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analyze Meme</h1>
            <p className="text-muted-foreground">Upload an image or paste a URL to fact-check</p>
          </div>
        </div>

        {/* Upload Form */}
        <UploadForm />
      </div>
    </div>
  )
}
