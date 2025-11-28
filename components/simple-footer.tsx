export function SimpleFooter() {
  return (
    <footer className="border-t border-border bg-background py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Meme-Busters.com. All rights reserved.
      </div>
    </footer>
  )
}
