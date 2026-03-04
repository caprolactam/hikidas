import type { DrawerMachine } from '../drawer/machine'
import { Phase } from '../drawer/reducer'
import {
  getActiveSnapRatio,
  getMaxSnapRatio,
  getMinSnapRatio,
} from '../drawer/snap-mode'
import { getViewportSize } from './get-viewport-size'
import { initCacheStyling } from './style-cache'
import { initVelocityTracker, type VelocityTracker } from './velocity-tracker'
import { resolveDragVisualDistance } from './visual-distance'

// ── Constants ─────────────────────────────────────────────────

const CONTENT_STYLES_IN_DRAGGING: Record<string, string> = {
  transition: 'none',
  userSelect: 'none',
}

const OVERLAY_STYLES_IN_DRAGGING: Record<string, string> = {
  transition: 'none',
}

const DRAG_START_MIN_DISTANCE_PX: Record<string, number> = {
  mouse: 2,
  touch: 10,
  pen: 2,
}

const DEFAULT_DRAG_START_MIN_DISTANCE_PX = 10

// ── Types ────────────────────────────────────────────────────

/**
 * Hooks for extending drag behavior (e.g., nesting coordination).
 * All hooks are optional — without them, the controller operates standalone.
 */
export interface DragHooks {
  /** Called before accepting a pointerdown. Return false to reject the gesture. */
  canStart?: () => boolean
  /** Called at Tracking → Dragging transition with the initial pointer position (set at pointerdown, never reset). */
  onDragStart?: (initialPointerPos: { x: number; y: number }) => void
  /** Called on each pointer move during Dragging phase with raw dismiss progress [0, 1]. */
  onDragProgress?: (rawDismissProgress: number) => void
  /** Called when the drag session ends (normal end, cancel, or pointer cancel). */
  onDragSessionEnd?: () => void
}

/** @internal */
export interface DragControllerOptions {
  element: HTMLElement
  overlayElement: HTMLElement | null
  machine: DrawerMachine
  hooks?: DragHooks
}

// ── Controller ───────────────────────────────────────────────

/**
 * Sets up per-element drag handling for a single drawer.
 * Listens for pointer events on the element, manages the drag lifecycle
 * (Tracking → Dragging → Settling), and applies visual transforms.
 *
 * Returns a cleanup function that removes all listeners and resets state.
 *
 * @internal
 */
export function createDragController(
  options: DragControllerOptions,
): () => void {
  const { element, overlayElement, machine, hooks } = options

  // ── Drag session state ──────────────────────────────────────

  let activePointerId: number | null = null
  /** Pointer position at pointerdown — used for raw dismiss progress (never reset). */
  let initialPointerPos: { x: number; y: number } | null = null
  let pointerCapture: PointerCapture | null = null
  /** Pointer coords reset at Tracking→Dragging transition to avoid visual jump. */
  let dragStartCoords: PointerCoords | null = null
  let velocityTracker: VelocityTracker | null = null
  let cachedDrawerRect: DOMRect | null = null
  let dragVisualDist: number | null = null
  const styleCache = initCacheStyling()

  // ── Session cleanup ─────────────────────────────────────────

  function endDragSession(): void {
    pointerCapture?.release()
    pointerCapture = null
    dragStartCoords = null
    velocityTracker?.cancel()
    velocityTracker = null
    cachedDrawerRect = null
    dragVisualDist = null
    activePointerId = null
    initialPointerPos = null
    hooks?.onDragSessionEnd?.()
  }

  // ── Gesture cancellation ────────────────────────────────────

  function cancelGesture(): void {
    if (activePointerId === null) return

    const { phase } = machine.snapshot
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) {
      endDragSession()
      return
    }

    switch (phase) {
      case Phase.Tracking:
        machine.cancelTracking()
        break
      case Phase.Dragging:
        styleCache.reset(element)
        if (overlayElement) {
          styleCache.reset(overlayElement)
        }
        machine.cancelDrag()
        break
      default:
        phase satisfies never
    }

    endDragSession()
  }

  // ── Pointer event handlers ──────────────────────────────────

  const handlePointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !e.isPrimary) return

    if (hooks?.canStart && !hooks.canStart()) return

    const targetNode = e.target
    if (!(targetNode instanceof HTMLElement)) return

    if (!isDragInteractionAllowed({ rootNode: element, targetNode })) {
      return
    }

    const acceptedTransition = machine.startTracking()
    if (!acceptedTransition) return

    activePointerId = e.pointerId
    initialPointerPos = { x: e.clientX, y: e.clientY }
    pointerCapture = createPointerCapture({
      target: targetNode,
      pointerId: e.pointerId,
    })
    dragStartCoords = initPointerCoords(e)
  }

  const handlePointerMove = (e: PointerEvent): void => {
    if (activePointerId !== e.pointerId) return
    if (!initialPointerPos) return

    if (!pointerCapture?.isSamePointer(e.pointerId)) return
    if (!dragStartCoords) return

    const {
      phase,
      snapMode,
      config: { direction, disableDragDismiss },
    } = machine.snapshot

    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    const pointerPos = { x: e.clientX, y: e.clientY }
    const draggedDistance =
      dragStartCoords.calcDraggedDistance(pointerPos)

    switch (phase) {
      case Phase.Tracking: {
        const highlightedText = window.getSelection()?.toString()
        // User doesn't want to drag, but wants to select text
        if (highlightedText && highlightedText.length > 0) {
          machine.cancelTracking()
          endDragSession()
          return
        }

        const isAcceptedTransition = machine.startDrag({
          draggedDistance,
          dragStartMinDistancePx:
            DRAG_START_MIN_DISTANCE_PX[e.pointerType] ??
            DEFAULT_DRAG_START_MIN_DISTANCE_PX,
        })

        if (isAcceptedTransition) {
          // Reset initial position to current so that drawer avoids visual jump
          dragStartCoords = initPointerCoords(e)
          velocityTracker = initVelocityTracker({
            timeStamp: e.timeStamp,
            pointerOffset: 0,
          })
          cachedDrawerRect = element.getBoundingClientRect()

          styleCache.set(element, CONTENT_STYLES_IN_DRAGGING)
          if (overlayElement) {
            styleCache.set(overlayElement, OVERLAY_STYLES_IN_DRAGGING)
          }

          hooks?.onDragStart?.(initialPointerPos!)
        }
        break
      }
      case Phase.Dragging: {
        if (!velocityTracker) return
        if (!cachedDrawerRect) return

        const currentSnapRatio = getActiveSnapRatio(snapMode)
        const drawerSize = direction.sizeOnAxis(cachedDrawerRect)

        const maxSnapRatio = getMaxSnapRatio(snapMode)
        const minSnapRatio = getMinSnapRatio(snapMode)
        const openingRubberBandThreshold =
          drawerSize * (maxSnapRatio - currentSnapRatio)
        const dismissRubberBandThreshold = disableDragDismiss
          ? drawerSize * (currentSnapRatio - minSnapRatio)
          : null

        const dragVisualDistValue = resolveDragVisualDistance({
          dragDelta: draggedDistance,
          direction,
          dismissRubberBandThreshold,
          openingRubberBandThreshold,
          drawerRect: cachedDrawerRect,
        })
        dragVisualDist = dragVisualDistValue

        velocityTracker.record({
          timeStamp: e.timeStamp,
          pointerOffset: direction.projectOnDismissAxis(draggedDistance),
        })

        // Base offset from snap point (in dismiss-positive space)
        const baseOffsetDismissPositive = drawerSize * (1 - currentSnapRatio)
        const totalVisualDist = baseOffsetDismissPositive + dragVisualDistValue

        const { x, y } = direction.dismissAxisToTranslate(totalVisualDist)
        element.style.transform = `translateX(${x}px) translateY(${y}px)`

        if (overlayElement) {
          const currentRatio = 1 - totalVisualDist / drawerSize
          const opacity = Math.min(1, currentRatio)
          overlayElement.style.opacity = `${opacity}`
        }

        // ── Raw dismiss progress for hooks (ancestor scale interpolation) ──
        if (hooks?.onDragProgress) {
          const liveDrawerSize = direction.sizeOnAxis(
            element.getBoundingClientRect(),
          )
          const pointerDelta = {
            x: e.clientX - initialPointerPos!.x,
            y: e.clientY - initialPointerPos!.y,
          }
          const dismissDist = direction.projectOnDismissAxis(pointerDelta)
          const rawProgress = Math.max(
            0,
            Math.min(1, dismissDist / liveDrawerSize),
          )
          hooks.onDragProgress(rawProgress)
        }

        break
      }
      default:
        phase satisfies never
    }
  }

  const handlePointerUp = (e: PointerEvent): void => {
    if (activePointerId !== e.pointerId) return

    const {
      phase,
      config: { direction },
    } = machine.snapshot

    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) {
      endDragSession()
      return
    }

    switch (phase) {
      case Phase.Tracking:
        machine.cancelTracking()
        break
      case Phase.Dragging: {
        if (!velocityTracker) return
        if (dragVisualDist === null) return

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

        const velocity = velocityTracker.end(e.timeStamp)

        styleCache.reset(element)
        if (overlayElement) {
          styleCache.reset(overlayElement)
        }

        // Drawer size is capped at viewport size so dragDistanceRatio stays in a reasonable range
        const drawerSize = direction.sizeOnAxis(
          calculateConstrainedDrawerSize(element.getBoundingClientRect()),
        )
        const dragDistanceRatio =
          drawerSize === 0 ? 0 : dragVisualDist / drawerSize

        machine.endDrag({
          velocityPxPerSec: velocity?.velocityPxPerSec ?? 0,
          dragDistanceRatio,
          drawerSize,
          isVelocityStale: velocity === null,
        })
        break
      }
      default:
        phase satisfies never
    }

    endDragSession()
  }

  const handlePointerCancel = (e: PointerEvent): void => {
    if (activePointerId !== e.pointerId) return
    cancelGesture()
  }

  const handleContextMenu = (): void => {
    if (activePointerId === null) return
    cancelGesture()
  }

  // ── Setup listeners ────────────────────────────────────────

  element.addEventListener('pointerdown', handlePointerDown, {
    passive: true,
  })
  element.addEventListener('pointermove', handlePointerMove, {
    passive: false,
  })
  element.addEventListener('pointerup', handlePointerUp, {
    passive: true,
  })
  element.addEventListener('pointercancel', handlePointerCancel, {
    passive: true,
  })
  element.addEventListener('contextmenu', handleContextMenu, {
    passive: true,
  })

  // ── Cleanup ────────────────────────────────────────────────

  return () => {
    element.removeEventListener('pointerdown', handlePointerDown)
    element.removeEventListener('pointermove', handlePointerMove)
    element.removeEventListener('pointerup', handlePointerUp)
    element.removeEventListener('pointercancel', handlePointerCancel)
    element.removeEventListener('contextmenu', handleContextMenu)
    endDragSession()
  }
}

// ── Helper functions ──────────────────────────────────────────

function isDragInteractionAllowed({
  rootNode,
  targetNode,
}: {
  rootNode: HTMLElement
  targetNode: HTMLElement
}): boolean {
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

type PointerCoords = ReturnType<typeof initPointerCoords>

function initPointerCoords(event: { clientX: number; clientY: number }) {
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

function calculateConstrainedDrawerSize(rect: DOMRect) {
  const viewport = getViewportSize()

  return {
    width: Math.min(rect.width, viewport.width),
    height: Math.min(rect.height, viewport.height),
  }
}
