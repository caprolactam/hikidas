import { useContext, useRef, type RefObject } from 'react'
import {
  initAnimate,
  type SpringAnimateConfig,
} from '../core/animation/animate'
import { DrawerIdContext, useDrawerRegistry } from './drawer-registry-context'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'
import { useStatic } from './utils/use-static'

// ── Constants ────────────────────────────────────────────────

/**
 * Distance in px used to derive the scale ratio (vaul-style).
 * scale = (window.innerWidth - NESTING_DISPLACEMENT * depth) / window.innerWidth
 */
const NESTING_DISPLACEMENT = 16

const NESTING_SPRING_CONFIG: SpringAnimateConfig = {
  bounce: 0,
  duration: 0.35,
  velocityPxPerSec: null,
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Scale computed at animation time so that reading window.innerWidth
 * happens after getComputedStyle() inside animate.play() — no extra layout flush.
 */
function scaleForDepth(depth: number): number {
  if (depth === 0) return 1
  return (window.innerWidth - NESTING_DISPLACEMENT * depth) / window.innerWidth
}

function parseScale(style: CSSStyleDeclaration): number {
  const raw = style.scale
  if (!raw || raw === 'none') return 1
  return parseFloat(raw) || 1
}

function applyNestingStyles(element: HTMLElement, depth: number): void {
  element.setAttribute('data-nested-drawer-open', '')
  element.style.scale = String(scaleForDepth(depth))
}

function clearNestingStyles(element: HTMLElement): void {
  element.removeAttribute('data-nested-drawer-open')
  element.style.scale = ''
}

// ── Hook ─────────────────────────────────────────────────────

interface UseNestingAnimationProps {
  elementRef: RefObject<HTMLElement | null>
}

/**
 * Subscribes to the DrawerRegistry's nesting state for the current drawer
 * and applies a scale spring animation when targetNestingDepth changes.
 *
 * When a child drawer opens, the registry increases this drawer's targetNestingDepth,
 * causing it to scale down (appear pushed into the background).
 * When the child closes, it scales back up.
 *
 * Scale uses a vaul-style formula: `(window.innerWidth - 16 * depth) / window.innerWidth`,
 * computed inside the animate.play() callback to avoid a forced layout flush.
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
      const targetDepth = state.targetNestingDepth

      // Set/remove data attribute before play() so it's batched with
      // the getComputedStyle read inside animate.play() — no extra forced sync.
      if (targetDepth > 0) {
        el.setAttribute('data-nested-drawer-open', '')
      } else {
        el.removeAttribute('data-nested-drawer-open')
      }

      animate
        .play(
          el,
          // Compute scale inside the callback: by this point getComputedStyle()
          // has already been called, so window.innerWidth read is free of extra layout flush.
          (prevStyle) => ({
            scale: [parseScale(prevStyle), scaleForDepth(targetDepth)],
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
