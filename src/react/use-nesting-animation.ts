import { useContext, useRef, type RefObject } from 'react'
import {
  type SpringAnimateConfig,
} from '../core/animation/animate'
import { useAnimate } from './utils/use-animate'
import {
  NestingPhase,
  getNestingDepth,
  type NestingState,
} from '../core/drawer-registry'
import { scaleForDepth } from '../core/nesting'
import { DrawerIdContext, useDrawerRegistry } from './drawer-registry-context'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'

// ── Constants ────────────────────────────────────────────────

const NESTING_SPRING_CONFIG: SpringAnimateConfig = {
  bounce: 0,
  duration: 0.35,
  velocityPxPerSec: null,
}

// ── Helpers ──────────────────────────────────────────────────

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
 * and applies scale animations based on the nesting phase.
 *
 * Handles three animation scenarios:
 * - **Scaling**: child opening/closing — spring to targetDepth
 * - **DragRestoring**: drag cancelled — spring back to committed nestingDepth
 * - **DragControlled**: skipped — DragRegistry controls scale directly
 *
 * No-op when DrawerRegistryProvider is not present.
 *
 * @internal
 */
export function useNestingAnimation({ elementRef }: UseNestingAnimationProps) {
  const drawerId = useContext(DrawerIdContext)
  const registry = useDrawerRegistry()
  const animate = useAnimate()
  const prevStateRef = useRef<NestingState | null>(null)

  useIsomorphicEffect(() => {
    if (!registry || !drawerId) return

    const element = elementRef.current

    // Apply initial nesting state without animation (e.g. defaultOpen on both parent and child)
    const initialState = registry.getNestingState(drawerId)
    prevStateRef.current = initialState

    const initialDepth = getNestingDepth(initialState)
    if (initialDepth > 0 && element) {
      applyNestingStyles(element, initialDepth)
    }

    const unsubscribe = registry.subscribe(() => {
      const el = elementRef.current
      if (!el) return

      const state = registry.getNestingState(drawerId)

      // Only react when nesting state actually changes (referential equality).
      // The reducer returns the same object when nothing changed, but produces
      // a new object when phase or target changes — including Scaling→Scaling
      // with a different targetDepth.
      if (state === prevStateRef.current) return
      prevStateRef.current = state

      switch (state.phase) {
        case NestingPhase.Scaling: {
          // Scale transition: animate to targetDepth
          const handle = registry.registerNestingTransition(drawerId)
          const targetDepth = state.targetDepth

          if (targetDepth > 0) {
            el.setAttribute('data-nested-drawer-open', '')
          } else {
            el.removeAttribute('data-nested-drawer-open')
          }

          animate
            .play(
              el,
              (prevStyle) => ({
                scale: [parseScale(prevStyle), scaleForDepth(targetDepth)],
              }),
              NESTING_SPRING_CONFIG,
            )
            .then(() => {
              handle?.reportComplete()
              if (targetDepth === 0) {
                clearNestingStyles(el)
              }
            })
            .catch(() => {
              handle?.reportCancel()
            })
          break
        }

        case NestingPhase.DragControlled:
          // DragRegistry is directly writing style.scale — do nothing.
          break

        case NestingPhase.DragRestoring: {
          // Drag cancelled: animate scale back to committed depth.
          // DragRegistry left an inline scale from the drag; we read it
          // via getComputedStyle and spring back to the committed depth.
          const handle = registry.registerNestingTransition(drawerId)
          const committedDepth = state.nestingDepth

          animate
            .play(
              el,
              (prevStyle) => ({
                scale: [parseScale(prevStyle), scaleForDepth(committedDepth)],
              }),
              NESTING_SPRING_CONFIG,
            )
            .then(() => {
              handle?.reportComplete()
            })
            .catch(() => {
              handle?.reportCancel()
            })
          break
        }

        case NestingPhase.Inactive:
        case NestingPhase.Active:
          // Stable states — no animation needed.
          break
      }
    })

    return () => {
      unsubscribe()
      // Reset styles on unmount
      if (element) {
        clearNestingStyles(element)
      }
    }
  }, [registry, drawerId, elementRef, animate])
}
