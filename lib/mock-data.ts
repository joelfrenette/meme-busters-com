import type { MemeAnalysis, VerdictType, Statement } from "./types"

const verdicts: VerdictType[] = ["LIAR", "DISHONEST", "FACTUAL"]

const mockStatements: Statement[] = [
  {
    id: "1",
    text: "Vaccines cause autism",
    verdict: "LIAR",
    explanation:
      "Multiple peer-reviewed studies have thoroughly debunked this claim. The original study was retracted due to fraudulent data.",
    sources: [
      { title: "CDC: Vaccine Safety", url: "https://www.cdc.gov/vaccinesafety" },
      { title: "WHO: Vaccines and Autism", url: "https://www.who.int/vaccines" },
    ],
  },
  {
    id: "2",
    text: "Climate change is a hoax",
    verdict: "LIAR",
    explanation:
      "97% of climate scientists agree that climate change is real and human-caused. Overwhelming evidence supports this.",
    sources: [
      { title: "NASA: Climate Evidence", url: "https://climate.nasa.gov/evidence" },
      { title: "IPCC Reports", url: "https://www.ipcc.ch" },
    ],
  },
]

export function generateMockAnalysis(imageUrl: string): MemeAnalysis {
  const verdict = verdicts[Math.floor(Math.random() * verdicts.length)]
  const id = `analysis-${Date.now()}`

  return {
    id,
    originalImageUrl: imageUrl,
    stampedImageUrl: imageUrl, // In real app, this would be the stamped version
    verdict,
    statements: mockStatements.slice(0, Math.floor(Math.random() * 2) + 1),
    analyzedAt: new Date(),
    shareableComment: `Verdict: ${verdict} - This meme contains ${verdict === "FACTUAL" ? "verified information" : verdict === "DISHONEST" ? "misleading claims" : "false information"}. Sources: ${mockStatements[0].sources[0].url}`,
  }
}

export function getVerdictColor(verdict: VerdictType): string {
  switch (verdict) {
    case "LIAR":
      return "verdict-liar"
    case "DISHONEST":
      return "verdict-dishonest"
    case "FACTUAL":
      return "verdict-factual"
  }
}

export function getVerdictLabel(verdict: VerdictType): string {
  return verdict
}
