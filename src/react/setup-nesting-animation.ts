import {
  type NestingState,
  type DrawerId,
  type DrawerRegistry,
  NestingPhase,
  getNestingDepth,
  NESTING_SPRING_CONFIG,
  parseScale,
  scaleForDepth,
  initAnimate,
} from '../core'

const ATTR_NESTED_OPEN = 'data-nested-drawer-open'

/**
 * Sets up nesting scale animation for a drawer element.
 * Plain function (not a React hook) — used inside NestingDrawerProvider's DragSetup factory.
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
  const animate = initAnimate()
  let prevState: NestingState | null = null

  // Apply initial nesting state without animation (e.g. defaultOpen on both parent and child)
  const initialState = registry.getNestingState(drawerId)
  prevState = initialState
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
    if (state === prevState) return
    prevState = state

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
    animate.cleanup()
    clearNestingStyles(element)
  }
}

function applyNestingStyles(element: HTMLElement, depth: number): void {
  element.setAttribute(ATTR_NESTED_OPEN, '')
  element.style.scale = String(scaleForDepth(depth))
}

function clearNestingStyles(element: HTMLElement): void {
  element.removeAttribute(ATTR_NESTED_OPEN)
  element.style.scale = ''
}
