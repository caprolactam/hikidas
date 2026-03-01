/**
 * Distance in px used to derive the scale ratio (vaul-style).
 * scale = (window.innerWidth - NESTING_DISPLACEMENT * depth) / window.innerWidth
 */
export const NESTING_DISPLACEMENT = 16

/**
 * Compute the scale for a given nesting depth.
 * depth=0 → 1 (foreground), depth=1 → slightly scaled down, etc.
 */
export function scaleForDepth(depth: number): number {
  if (depth === 0) return 1
  return (window.innerWidth - NESTING_DISPLACEMENT * depth) / window.innerWidth
}
