import { useRef, type RefObject } from 'react'
import {
  type NestingState,
  type DrawerId,
  NestingPhase,
  getNestingDepth,
  NESTING_SPRING_CONFIG,
  parseScale,
  scaleForDepth,
} from '../core'
import { useDrawerRegistry } from './context'
import { useAnimate } from './utils/use-animate'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'

const ATTR_NESTED_OPEN = 'data-nested-drawer-open'

interface UseNestingAnimationProps {
  drawerId: DrawerId
  elementRef: RefObject<HTMLElement | null>
}

/** @internal */
export function useNestingAnimation({
  elementRef,
  drawerId,
}: UseNestingAnimationProps) {
  const registry = useDrawerRegistry()
  const animate = useAnimate()
  const prevStateRef = useRef<NestingState | null>(null)

  useIsomorphicEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Apply initial nesting state without animation (e.g. defaultOpen on both parent and child)
    const initialState = registry.getNestingState(drawerId)
    prevStateRef.current = initialState
    const initialDepth = getNestingDepth(initialState)
    if (initialDepth > 0) {
      applyNestingStyles(element, initialDepth)
    }

    const unsubscribe = registry.subscribe(() => {
      const state = registry.getNestingState(drawerId)

      // Only react when nesting state actually changes (referential equality).
      // The reducer returns the same object when nothing changed, but produces
      // a new object when phase or target changes — including Scaling→Scaling
      // with a different targetDepth.
      if (state === prevStateRef.current) return
      prevStateRef.current = state

      const handle = registry.registerNestingTransition(drawerId)
      if (!handle) return

      switch (state.phase) {
        case NestingPhase.Scaling: {
          const targetDepth = state.targetDepth

          if (targetDepth > 0) {
            element.setAttribute(ATTR_NESTED_OPEN, '')
          } else {
            element.removeAttribute(ATTR_NESTED_OPEN)
          }

          animate
            .play(
              element,
              (prevStyle) => ({
                scale: [parseScale(prevStyle), scaleForDepth(targetDepth)],
              }),
              NESTING_SPRING_CONFIG,
            )
            .then(() => {
              handle.reportComplete()
              if (targetDepth === 0) {
                clearNestingStyles(element)
              }
            })
            .catch(handle.reportCancel)
          break
        }

        case NestingPhase.DragRestoring: {
          const committedDepth = state.nestingDepth

          animate
            .play(
              element,
              (prevStyle) => ({
                scale: [parseScale(prevStyle), scaleForDepth(committedDepth)],
              }),
              NESTING_SPRING_CONFIG,
            )
            .then(handle.reportComplete)
            .catch(handle.reportCancel)
          break
        }
        case NestingPhase.DragControlled:
        case NestingPhase.Inactive:
        case NestingPhase.Active:
          break
        default:
          const _exhaustiveCheck: never = state
          return _exhaustiveCheck
      }
    })

    return () => {
      unsubscribe()
      clearNestingStyles(element)
    }
  }, [registry, drawerId, elementRef, animate])
}

function applyNestingStyles(element: HTMLElement, depth: number): void {
  element.setAttribute(ATTR_NESTED_OPEN, '')
  element.style.scale = String(scaleForDepth(depth))
}

function clearNestingStyles(element: HTMLElement): void {
  element.removeAttribute(ATTR_NESTED_OPEN)
  element.style.scale = ''
}
