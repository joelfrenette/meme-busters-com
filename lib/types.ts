export type VerdictType =
  // Truthfulness & Accuracy categories
  | "FACTUAL"
  | "MISLEADING"
  | "OUT_OF_CONTEXT"
  | "DISTORTED"
  | "MISINFORMATION"
  | "LIES"
  | "UNVERIFIABLE"
  // Tone-Based categories
  | "SARCASM"
  | "SATIRE"
  | "HUMOR"
  | "WHOLESOME"
  | "DARK_HUMOR"

export interface Statement {
  id: string
  text: string
  verdict: VerdictType
  explanation: string
  sources: Source[]
}

export interface Source {
  title: string
  url: string
}

export interface MemeAnalysis {
  id: string
  originalImageUrl: string
  stampedImageUrl: string
  verdict: VerdictType
  statements: Statement[]
  analyzedAt: Date
  shareableComment: string
}

export interface HistoryItem {
  id: string
  thumbnailUrl: string
  verdict: VerdictType
  analyzedAt: Date
}
