"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MemeGalleryProps {
  memes: Array<{
    id: string
    image: string
    verdict:
      | "LIES"
      | "DISHONEST"
      | "FACTUAL"
      | "PROPAGANDA"
      | "SARCASM"
      | "SATIRE"
      | "HUMOR"
      | "WHOLESOME"
      | "DARK_HUMOR"
      | "MISLEADING"
      | "OUT_OF_CONTEXT"
      | "DISTORTED"
      | "MISINFORMATION"
      | "UNVERIFIABLE"
    title: string
  }>
}

export function MemeGallery({ memes }: MemeGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const galleryMemes =
    memes.length > 0
      ? memes
      : [
          {
            id: "placeholder",
            image: "/fact-check-meme.jpg",
            verdict: "LIES" as const,
            title: "No memes analyzed yet",
          },
        ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryMemes.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [galleryMemes.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryMemes.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryMemes.length) % galleryMemes.length)
  }

  const currentMeme = galleryMemes[currentIndex]

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "FACTUAL":
        return "bg-green-500"
      case "MISLEADING":
        return "bg-yellow-500"
      case "OUT_OF_CONTEXT":
        return "bg-amber-500"
      case "DISTORTED":
        return "bg-orange-500"
      case "MISINFORMATION":
        return "bg-red-400"
      case "LIES":
        return "bg-red-600"
      case "UNVERIFIABLE":
        return "bg-gray-500"
      case "SARCASM":
        return "bg-purple-500"
      case "SATIRE":
        return "bg-purple-600"
      case "HUMOR":
        return "bg-blue-500"
      case "WHOLESOME":
        return "bg-teal-500"
      case "DARK_HUMOR":
        return "bg-gray-700"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-lg">
      <div className="relative aspect-[4/3] w-full p-4 bg-gray-50">
        <Link href={`/results/${currentMeme.id}`} className="block relative w-full h-full">
          <Image
            src={currentMeme.image || "/placeholder.svg"}
            alt={currentMeme.title}
            fill
            className="object-contain p-2 cursor-pointer hover:opacity-90 transition-opacity"
            priority
          />
        </Link>
        <div className="absolute top-3 right-3">
          <Badge className={`${getVerdictColor(currentMeme.verdict)} text-white border-0`}>{currentMeme.verdict}</Badge>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-white font-medium text-sm">{currentMeme.title}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={nextSlide}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
        {galleryMemes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
