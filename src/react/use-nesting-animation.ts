import { useContext, useRef, type RefObject } from 'react'
import {
  initAnimate,
  type SpringAnimateConfig,
} from '../core/animation/animate'
import { DrawerIdContext, useDrawerRegistry } from './drawer-registry-context'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'
import { useStatic } from './utils/use-static'

// ── Constants ────────────────────────────────────────────────

/** Scale reduction per nesting depth level. depth=1 → scale=0.95, depth=2 → scale=0.90 */
const NESTING_SCALE_FACTOR = 0.05

const NESTING_SPRING_CONFIG: SpringAnimateConfig = {
  bounce: 0,
  duration: 0.35,
  velocityPxPerSec: null,
}

// ── Helpers ──────────────────────────────────────────────────

function scaleForDepth(depth: number): number {
  return 1 - depth * NESTING_SCALE_FACTOR
}

function parseScale(style: CSSStyleDeclaration): number {
  const raw = style.scale
  if (!raw || raw === 'none') return 1
  return parseFloat(raw) || 1
}

function applyNestingStyles(element: HTMLElement, depth: number): void {
  if (depth === 0) {
    clearNestingStyles(element)
  } else {
    element.style.scale = String(scaleForDepth(depth))
  }
}

function clearNestingStyles(element: HTMLElement): void {
  element.style.scale = ''
}

// ── Hook ─────────────────────────────────────────────────────

interface UseNestingAnimationProps {
  elementRef: RefObject<HTMLElement | null>
}

/**
 * Subscribes to the DrawerRegistry's nesting state for the current drawer
 * and applies scale spring animations when targetNestingDepth changes.
 *
 * When a child drawer opens, the registry increases this drawer's targetNestingDepth,
 * causing it to scale down (appear pushed into the background).
 * When the child closes, it scales back up.
 *
 * No-op when DrawerRegistryProvider is not present.
 *
 * @internal
 */
export function useNestingAnimation({ elementRef }: UseNestingAnimationProps) {
  const drawerId = useContext(DrawerIdContext)
  const registry = useDrawerRegistry()
  const animate = useStatic(() => initAnimate())
  const prevTargetRef = useRef<number | null>(null)

  useIsomorphicEffect(() => {
    if (!registry || !drawerId) return

    const element = elementRef.current

    // Apply initial nesting state without animation (e.g. defaultOpen on both parent and child)
    const initialState = registry.getNestingState(drawerId)
    prevTargetRef.current = initialState.targetNestingDepth

    if (initialState.nestingDepth > 0 && element) {
      applyNestingStyles(element, initialState.nestingDepth)
    }

    const unsubscribe = registry.subscribe(() => {
      const el = elementRef.current
      if (!el) return

      const state = registry.getNestingState(drawerId)

      // Only react when targetNestingDepth actually changes
      if (state.targetNestingDepth === prevTargetRef.current) return
      prevTargetRef.current = state.targetNestingDepth

      const handle = registry.registerNestingTransition(drawerId)
      const targetScale = scaleForDepth(state.targetNestingDepth)
      const targetDepth = state.targetNestingDepth

      animate
        .play(
          el,
          (prevStyle) => ({
            scale: [parseScale(prevStyle), targetScale],
          }),
          NESTING_SPRING_CONFIG,
        )
        .then(() => {
          handle?.reportComplete()
          // Clear inline styles when returning to base state to respect CSS cascade
          if (targetDepth === 0) {
            clearNestingStyles(el)
          }
        })
        .catch(() => {
          handle?.reportCancel()
        })
    })

    return () => {
      unsubscribe()
      animate.cleanup()
      // Reset styles on unmount
      if (element) {
        clearNestingStyles(element)
      }
    }
  }, [registry, drawerId, elementRef, animate])
}
