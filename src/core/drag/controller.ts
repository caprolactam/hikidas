import type { DrawerMachine } from '../drawer/machine'
import { Phase } from '../drawer/phase'
import {
  getActiveSnapRatio,
  getMaxSnapRatio,
  getMinSnapRatio,
} from '../drawer/snap-mode'
import { initVelocityTracker, type VelocityTracker } from './velocity-tracker'
import { getViewportSize, resolveDragVisualDistance } from './visual-distance'

type CSSProperties = Record<string, string>

const CONTENT_STYLES_IN_DRAGGING: CSSProperties = {
  transition: 'none',
  userSelect: 'none',
}

const OVERLAY_STYLES_IN_DRAGGING: CSSProperties = {
  transition: 'none',
}

const DRAG_START_MIN_DISTANCE_PX: Record<string, number> = {
  mouse: 2,
  touch: 10,
  pen: 2,
}

const DEFAULT_DRAG_START_MIN_DISTANCE_PX = 10

/**
 * Hooks for extending drag behavior (e.g. nesting coordination).
 * All hooks are optional — without them, the controller operates standalone.
 */
interface DragHooks {
  /** Called before accepting a pointerdown. Return false to reject the gesture. */
  canStart?: () => boolean
  /** Called at Tracking → Dragging transition with the initial pointer position. */
  onDragStart?: (initialPointerPos: { x: number; y: number }) => void
  /**
   * Called on each pointer move during Dragging phase.
   * `dismissProgress` is `totalVisualDist / drawerSize`: 0 at snap point, 1 when fully dismissed.
   * Negative values occur when dragging in the opening direction beyond the snap point.
   */
  onDragMove?: (props: { dismissProgress: number }) => void
  /** Called when the drag session ends (normal end, cancel, or pointer cancel). */
  onDragSessionEnd?: () => void
}

/** @internal */
export class DragController {
  readonly #element: HTMLElement
  readonly #overlayElement: HTMLElement | null
  readonly #machine: DrawerMachine
  #hooks: DragHooks | undefined

  #pointerCapture: PointerCapture | null = null
  #pointerCoords: PointerCoords | null = null
  #velocityTracker: VelocityTracker | null = null
  #cachedDrawerRect: DOMRect | null = null
  #dragVisualDist: number | null = null
  readonly #styleCache = createStyleCache()
  readonly #abortController = new AbortController()

  constructor({
    element,
    overlayElement,
    machine,
  }: {
    element: HTMLElement
    overlayElement: HTMLElement | null
    machine: DrawerMachine
  }) {
    this.#element = element
    this.#overlayElement = overlayElement
    this.#machine = machine

    const { signal } = this.#abortController
    this.#element.addEventListener('pointerdown', this.#handlePointerDown, {
      signal,
    })
    this.#element.addEventListener('pointermove', this.#handlePointerMove, {
      signal,
    })
    this.#element.addEventListener('pointerup', this.#handlePointerUp, {
      signal,
    })
    this.#element.addEventListener('pointercancel', this.#handlePointerCancel, {
      signal,
    })
    this.#element.addEventListener('contextmenu', this.#handleContextMenu, {
      signal,
    })

    this.#element.style.touchAction = 'none'
  }

  get element(): HTMLElement {
    return this.#element
  }

  setHooks(hooks: DragHooks): void {
    this.#hooks = hooks
  }

  dispose(): void {
    if (this.#pointerCapture) {
      this.#pointerCapture.release()
    }
    this.#abortController.abort()

    this.#element.style.touchAction = ''
  }

  #endDragSession(): void {
    if (this.#pointerCapture) {
      this.#pointerCapture.release()
      this.#pointerCapture = null
    }
    this.#pointerCoords = null
    if (this.#velocityTracker) {
      this.#velocityTracker.cancel()
      this.#velocityTracker = null
    }
    this.#cachedDrawerRect = null
    this.#dragVisualDist = null
    if (this.#hooks?.onDragSessionEnd) {
      this.#hooks.onDragSessionEnd()
    }
  }

  #handlePointerDown = (e: PointerEvent): void => {
    const targetNode = e.target
    if (!(targetNode instanceof HTMLElement)) return

    if (
      !isDragInteractionAllowed({
        event: e,
        rootNode: this.#element,
        targetNode,
      })
    ) {
      return
    }

    if (this.#hooks?.canStart && !this.#hooks.canStart()) return

    const acceptedTransition = this.#machine.startTracking()
    if (!acceptedTransition) return

    this.#pointerCapture = createPointerCapture({
      target: targetNode,
      pointerId: e.pointerId,
    })
    this.#pointerCoords = createPointerCoords(e)
  }

  #handlePointerMove = (e: PointerEvent): void => {
    if (!this.#pointerCapture) return
    if (!this.#pointerCapture.isSamePointer(e.pointerId)) return
    if (!this.#pointerCoords) return
    const phase = this.#machine.snapshot.phase
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    const {
      snapMode,
      config: { direction, disableDragDismiss },
    } = this.#machine.snapshot
    const pointerPos = { x: e.clientX, y: e.clientY }
    const draggedDistance = this.#pointerCoords.calcDraggedDistance(pointerPos)

    switch (phase) {
      case Phase.Tracking: {
        const highlightedText = window.getSelection()?.toString()
        // User doesn't want to drag, but wants to select text
        if (highlightedText) {
          this.#machine.cancelTracking()
          this.#endDragSession()
          return
        }

        const acceptedTransition = this.#machine.startDrag({
          draggedDistance,
          dragStartMinDistancePx:
            DRAG_START_MIN_DISTANCE_PX[e.pointerType] ??
            DEFAULT_DRAG_START_MIN_DISTANCE_PX,
        })

        if (acceptedTransition) {
          // Reset initial position to current so that drawer avoids visual jump
          this.#pointerCoords = createPointerCoords(e)
          this.#velocityTracker = initVelocityTracker({
            timeStamp: e.timeStamp,
            pointerOffset: 0,
          })
          this.#cachedDrawerRect = this.#element.getBoundingClientRect()

          this.#styleCache.set(this.#element, CONTENT_STYLES_IN_DRAGGING)
          if (this.#overlayElement) {
            this.#styleCache.set(
              this.#overlayElement,
              OVERLAY_STYLES_IN_DRAGGING,
            )
          }

          if (this.#hooks?.onDragStart) {
            this.#hooks.onDragStart(pointerPos)
          }
        }
        break
      }
      case Phase.Dragging: {
        if (!this.#velocityTracker) return
        if (!this.#cachedDrawerRect) return

        const currentSnapRatio = getActiveSnapRatio(snapMode)
        const drawerSize = direction.sizeOnAxis(this.#cachedDrawerRect)
        const maxSnapRatio = getMaxSnapRatio(snapMode)
        const minSnapRatio = getMinSnapRatio(snapMode)
        const openingRubberBandThreshold =
          drawerSize * (maxSnapRatio - currentSnapRatio)
        const dismissRubberBandThreshold = disableDragDismiss
          ? drawerSize * (currentSnapRatio - minSnapRatio)
          : null

        const dragVisualDist = resolveDragVisualDistance({
          dragDelta: draggedDistance,
          direction,
          dismissRubberBandThreshold,
          openingRubberBandThreshold,
          drawerRect: this.#cachedDrawerRect,
        })
        this.#dragVisualDist = dragVisualDist

        this.#velocityTracker.record({
          timeStamp: e.timeStamp,
          pointerOffset: direction.projectOnDismissAxis(draggedDistance),
        })

        // Base offset from snap point (in dismiss-positive space)
        const snapPointOffset = drawerSize * (1 - currentSnapRatio)
        const totalVisualDist = snapPointOffset + dragVisualDist
        const { x, y } = direction.dismissAxisToTranslate(totalVisualDist)

        this.#element.style.transform = `translateX(${x}px) translateY(${y}px)`

        if (this.#overlayElement) {
          const openRatio = 1 - totalVisualDist / drawerSize
          const opacity = Math.min(1, openRatio)
          this.#overlayElement.style.opacity = `${opacity}`
        }

        if (this.#hooks?.onDragMove) {
          const dismissProgress = Math.min(1, totalVisualDist / drawerSize)
          this.#hooks.onDragMove({ dismissProgress })
        }

        break
      }
      default:
        phase satisfies never
    }
  }

  #handlePointerUp = (e: PointerEvent): void => {
    if (!this.#pointerCapture) return
    if (!this.#pointerCapture.isSamePointer(e.pointerId)) return
    if (!this.#pointerCoords) return
    const phase = this.#machine.snapshot.phase
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    switch (phase) {
      case Phase.Tracking:
        this.#machine.cancelTracking()
        break
      case Phase.Dragging: {
        if (!this.#velocityTracker) return
        if (this.#dragVisualDist === null) return // dragVisualDist sometimes set falsy value like 0, so check null explicitly

        // Suppress click event after dragging to prevent accidental clicks
        if (e.target instanceof EventTarget) {
          e.target.addEventListener(
            'click',
            (event) => {
              event.stopPropagation()
            },
            { once: true, capture: true },
          )
        }

        this.#styleCache.reset(this.#element)
        if (this.#overlayElement) {
          this.#styleCache.reset(this.#overlayElement)
        }

        const velocityResult = this.#velocityTracker.end(e.timeStamp)
        // Drawer size is capped at viewport size so dragDistanceRatio stays in a reasonable range
        const drawerSize = this.#machine.snapshot.config.direction.sizeOnAxis(
          constrainSizeToViewport(this.#element.getBoundingClientRect()),
        )
        const dragDistanceRatio =
          drawerSize === 0 ? 0 : this.#dragVisualDist / drawerSize

        this.#machine.endDrag({
          velocityPxPerSec: velocityResult?.velocityPxPerSec ?? 0,
          isVelocityStale: velocityResult === null,
          dragDistanceRatio,
          drawerSize,
        })
        break
      }
      default:
        phase satisfies never
    }

    this.#endDragSession()
  }

  #handlePointerCancel = (_e: PointerEvent): void => {
    this.#cancelGesture()
  }

  #handleContextMenu = (): void => {
    this.#cancelGesture()
  }

  #cancelGesture(): void {
    const { phase } = this.#machine.snapshot
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    switch (phase) {
      case Phase.Tracking:
        this.#machine.cancelTracking()
        break
      case Phase.Dragging:
        this.#styleCache.reset(this.#element)
        if (this.#overlayElement) {
          this.#styleCache.reset(this.#overlayElement)
        }
        this.#machine.cancelDrag()
        break
      default:
        phase satisfies never
    }

    this.#endDragSession()
  }
}

function isDragInteractionAllowed({
  event,
  rootNode,
  targetNode,
}: {
  event: PointerEvent
  rootNode: HTMLElement
  targetNode: HTMLElement
}): boolean {
  if (event.button !== 0 || !event.isPrimary) return false

  if (!rootNode.contains(targetNode)) return false

  if (
    targetNode.hasAttribute('data-drawer-no-drag') ||
    targetNode.closest('[data-drawer-no-drag]')
  ) {
    return false
  }

  // Fixes https://github.com/emilkowalski/vaul/issues/483
  const tagName = targetNode.tagName
  if (
    tagName === 'SELECT' ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    targetNode.isContentEditable
  ) {
    return false
  }

  let el: HTMLElement | null = targetNode
  while (el) {
    if (
      el.getAttribute('role') === 'dialog' ||
      el === document.documentElement
    ) {
      break
    }

    if (el.scrollHeight > el.clientHeight) {
      if (el.scrollTop !== 0) {
        return false
      }
    }

    el = el.parentElement
  }

  return true
}

type PointerCapture = ReturnType<typeof createPointerCapture>

function createPointerCapture(props: {
  target: HTMLElement
  pointerId: number
}) {
  props.target.setPointerCapture(props.pointerId)

  return {
    isSamePointer(pointerId: number) {
      return props.pointerId === pointerId
    },
    release() {
      try {
        props.target.releasePointerCapture(props.pointerId)
      } catch {}
    },
  }
}

type PointerCoords = ReturnType<typeof createPointerCoords>

function createPointerCoords(event: { clientX: number; clientY: number }) {
  const initialCoords = { x: event.clientX, y: event.clientY }

  return {
    calcDraggedDistance: (coords: { x: number; y: number }) => {
      return {
        x: coords.x - initialCoords.x,
        y: coords.y - initialCoords.y,
      }
    },
  }
}

function constrainSizeToViewport(rect: DOMRect) {
  const viewport = getViewportSize()

  return {
    width: Math.min(rect.width, viewport.width),
    height: Math.min(rect.height, viewport.height),
  }
}

function createStyleCache() {
  const cache = new WeakMap<HTMLElement, Map<string, string>>()

  function set(el: HTMLElement, styles: CSSProperties) {
    let propCache = cache.get(el)
    if (!propCache) {
      propCache = new Map<string, string>()
      cache.set(el, propCache)
    }

    Object.keys(styles).forEach((key) => {
      if (propCache.has(key)) return

      if (key.startsWith('--')) {
        propCache.set(key, el.style.getPropertyValue(key))
      } else {
        propCache.set(key, (el.style as any)[key])
      }
    })

    setStyles(el, styles)
  }

  function reset(el: HTMLElement) {
    const propCache = cache.get(el)

    if (!propCache) return

    setStyles(el, Object.fromEntries(propCache))

    propCache.clear()
    cache.delete(el)
  }

  return {
    set,
    reset,
  }
}

function setStyles(node: HTMLElement, styles: CSSProperties) {
  Object.entries(styles).forEach(([key, value]) => {
    if (key.startsWith('--')) {
      if (value == null || value === '') {
        node.style.removeProperty(key)
      } else {
        node.style.setProperty(key, value)
      }
    } else {
      if (value == null) {
        ;(node.style as any)[key] = ''
      } else {
        ;(node.style as any)[key] = value
      }
    }
  })
}
