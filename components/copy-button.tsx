"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopy} variant="outline" size="sm" className="text-xs bg-transparent">
      {copied ? "Copied!" : "Copy to Clipboard"}
    </Button>
  )
}
