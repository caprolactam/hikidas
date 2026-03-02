import type { SpringAnimateConfig } from './animate'

/** @internal */
export const NESTING_SPRING_CONFIG: SpringAnimateConfig = {
  bounce: 0,
  duration: 0.35,
  velocityPxPerSec: null,
}

/** @internal */
export function parseScale(style: CSSStyleDeclaration): number {
  const raw = style.scale
  if (!raw || raw === 'none') return 1
  return parseFloat(raw) || 1
}
