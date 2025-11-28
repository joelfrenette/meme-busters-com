import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, Search, Share2, Shield, Zap, TrendingUp } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">How It Works</h2>
              <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                Our AI-powered system analyzes memes in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 space-y-4 border-2 hover:border-primary transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">1. Upload</h3>
                  <p className="text-muted-foreground">
                    Drop your meme image or paste a URL. We support all major formats.
                  </p>
                </div>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:border-primary transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">2. Analyze</h3>
                  <p className="text-muted-foreground">
                    Our AI extracts claims and cross-references them with trusted sources.
                  </p>
                </div>
              </Card>

              <Card className="p-6 space-y-4 border-2 hover:border-primary transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">3. Share</h3>
                  <p className="text-muted-foreground">
                    Get a detailed verdict with sources. Share the truth with others.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why MemeBusters */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">Why MemeBusters?</h2>
              <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                The most powerful fact-checking tool for social media
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Lightning Fast</h3>
                <p className="text-muted-foreground">Get results in under 3 seconds. No waiting, no hassle.</p>
              </div>

              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Trusted Sources</h3>
                <p className="text-muted-foreground">We only use verified, reputable sources for fact-checking.</p>
              </div>

              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Always Learning</h3>
                <p className="text-muted-foreground">
                  Our AI improves daily, staying ahead of new misinformation tactics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-balance">Ready to Bust Some Memes?</h2>
              <p className="text-base md:text-lg text-muted-foreground text-balance">
                Join thousands of users fighting misinformation one meme at a time.
              </p>
            </div>
            <Button asChild size="lg" className="bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)] text-white">
              <Link href="/analyze">
                <Upload className="mr-2 h-5 w-5" />
                Start Fact-Checking
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
