/**
 * Normalizes confidence values to percentage (0-100).
 * Handles both decimal values (0.8) and percentage values (80).
 */
export function formatConfidence(confidence: number): number {
  // If confidence is between 0 and 1 (exclusive of 1 but we check <= 1 for edge cases),
  // it's a decimal - multiply by 100
  if (confidence > 0 && confidence <= 1) {
    return Math.round(confidence * 100)
  }
  // Otherwise it's already a percentage
  return Math.round(confidence)
}
