import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { MemeGallery } from "@/components/meme-gallery"

export default async function HomePage() {
  let recentMemes: Array<{
    id: string
    image: string
    verdict: string
    title: string
  }> = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("meme_analyses")
      .select("id, image_url, verdict, claims")
      .order("analyzed_at", { ascending: false })
      .limit(10)

    if (data && data.length > 0) {
      recentMemes = data.map((item) => ({
        id: item.id,
        image: item.image_url || "/fact-check-meme.jpg",
        verdict: item.verdict,
        title:
          Array.isArray(item.claims) && item.claims.length > 0 && item.claims[0]?.text
            ? item.claims[0].text
            : "Fact-checked meme",
      }))
    }
  } catch (error) {
    // Silently handle error - gallery will show placeholder
    console.log("[v0] Could not fetch memes, showing placeholder")
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="logo-text">Meme-Busters</span>
                  <span className="text-foreground">.com</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600">
                  The Fastest Meme Fact-Checker on the Planet.
                  <br />
                  Easily verify claims in images or memes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-[rgb(0,132,255)] hover:bg-[rgb(0,112,235)] text-white font-semibold"
                >
                  <Link href="/analyze">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Meme
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold bg-transparent">
                  <Link href="/about">Learn How</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-[rgb(0,132,255)]">10K+</div>
                  <div className="text-sm text-gray-600">Memes Checked</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-[rgb(0,132,255)]">95%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-[rgb(0,132,255)]">{"<"}3s</div>
                  <div className="text-sm text-gray-600">Avg. Check Time</div>
                </div>
              </div>
            </div>

            {/* Right Column - Meme Gallery */}
            <div className="hidden md:block">
              <MemeGallery memes={recentMemes} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
