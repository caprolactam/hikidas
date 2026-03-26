import type {
  DrawerId,
  DrawerRegistry,
  NestingState,
} from '../nesting/registry'
import { NestingPhase, getNestingDepth } from '../nesting/registry'
import { scaleForDepth } from '../nesting/scale'
import type { SpringAnimateConfig } from './animate'
import { initAnimate } from './animate'

const NESTING_SPRING_CONFIG: SpringAnimateConfig = {
  bounce: 0,
  duration: 0.35,
  velocityPxPerSec: null,
}

const ATTR_NESTED_DRAWER_OPEN = 'data-nested-drawer-open'

const noop = () => {}

/**
 * Sets up nesting scale animation for a drawer element.
 *
 * Creates its own animation controller and subscribes to registry changes.
 * Returns a cleanup function.
 *
 * @internal
 */
export function setupNestingAnimation(params: {
  registry: DrawerRegistry
  drawerId: DrawerId
  element: HTMLElement
}): () => void {
  const { registry, drawerId, element } = params
  const drawer = registry.getNode(drawerId)
  if (!drawer) return noop

  const { nesting: initialNestingState } = drawer
  let prevState: NestingState = initialNestingState
  const animate = initAnimate()

  // Apply initial nesting state without animation (e.g. defaultOpen on both parent and child)
  const initialDepth = getNestingDepth(initialNestingState)
  if (initialDepth > 0) {
    applyNestingStyles(element, initialDepth)
  }

  const unsubscribe = registry.subscribe(() => {
    const state = registry.getNode(drawerId)
    if (!state) return
    const nestingState = state.nesting

    // Only animate when nesting state actually changes (referential equality).
    // The reducer returns the same object when nothing changed, but produces
    // a new object when phase or target changes — including Scaling→Scaling
    // with a different targetDepth.
    if (nestingState === prevState) return

    prevState = nestingState

    const handle = registry.registerNestingTransition(drawerId)
    if (!handle.isTransitionable) return

    switch (nestingState.phase) {
      case NestingPhase.Scaling: {
        const targetDepth = nestingState.targetDepth

        if (targetDepth > 0) {
          element.setAttribute(ATTR_NESTED_DRAWER_OPEN, '')
        } else {
          element.removeAttribute(ATTR_NESTED_DRAWER_OPEN)
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
        const committedDepth = nestingState.nestingDepth

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
      default:
        break
    }
  })

  return () => {
    unsubscribe()
    animate.cleanup()
    clearNestingStyles(element)
  }
}

function applyNestingStyles(element: HTMLElement, depth: number): void {
  element.setAttribute(ATTR_NESTED_DRAWER_OPEN, '')
  element.style.scale = String(scaleForDepth(depth))
}

function clearNestingStyles(element: HTMLElement): void {
  element.removeAttribute(ATTR_NESTED_DRAWER_OPEN)
  element.style.scale = ''
}

function parseScale(style: CSSStyleDeclaration): number {
  const raw = style.scale
  if (!raw || raw === 'none') return 1
  return parseFloat(raw) || 1
}
