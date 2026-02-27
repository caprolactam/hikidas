import { useCallback, useRef } from 'react'
import type React from 'react'
import { initCacheStyling } from '../core/drag/style-cache'
import {
  initVelocityTracker,
  type VelocityTracker,
} from '../core/drag/velocity-tracker'
import { resolveDragVisualDistance } from '../core/drag/visual-distance'
import type { DrawerMachine } from '../core/drawer-machine'
import { Phase } from '../core/reducer'
import {
  getActiveSnapRatio,
  getMaxSnapRatio,
  getMinSnapRatio,
} from '../core/snap-mode'
import { getViewportSize } from '../core/utils/get-viewport-size'
import { useStatic } from './utils/use-static'

const CONTENT_STYLES_IN_DRAGGING = {
  transition: 'none',
  userSelect: 'none',
} satisfies React.CSSProperties

const OVERLAY_STYLES_IN_DRAGGING = {
  transition: 'none',
} satisfies React.CSSProperties

const DRAG_START_MIN_DISTANCE_PX: {
  [key in 'mouse' | 'touch' | 'pen']: number
} = {
  mouse: 2,
  touch: 10,
  pen: 2,
}

/** @internal */
export interface UseDrawerGestureParams {
  machine: DrawerMachine
  contentRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
}

/** @internal */
export function useDrawerGesture({
  machine,
  contentRef,
  overlayRef,
}: UseDrawerGestureParams) {
  const pointerCaptureRef = useRef<PointerCapture | null>(null)
  const pointerCoordsRef = useRef<PointerCoords | null>(null)
  const velocityTrackerRef = useRef<VelocityTracker | null>(null)
  const drawerRectRef = useRef<DOMRect | null>(null)
  const dragVisualDistRef = useRef<number | null>(null)
  const styleCache = useStatic(() => initCacheStyling())

  const endDragSession = () => {
    if (pointerCaptureRef.current) {
      pointerCaptureRef.current.release()
      pointerCaptureRef.current = null
    }
    pointerCoordsRef.current = null
    if (velocityTrackerRef.current) {
      velocityTrackerRef.current.cancel()
      velocityTrackerRef.current = null
    }
    drawerRectRef.current = null
    dragVisualDistRef.current = null
  }

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rootNode = contentRef.current
      if (!rootNode) return

      const targetNode = event.target
      if (!(targetNode instanceof HTMLElement)) return

      if (!isDragInteractionAllowed({ event, rootNode, targetNode })) return

      const acceptedTransition = machine.startTracking()
      if (!acceptedTransition) return

      pointerCaptureRef.current = createPointerCapture({
        target: targetNode,
        pointerId: event.pointerId,
      })
      pointerCoordsRef.current = initPointerCoords(event)
    },
    [contentRef, machine],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const {
        phase,
        snapMode,
        config: { direction, disableDragDismiss },
      } = machine.snapshot

      const rootNode = contentRef.current
      if (!rootNode) return

      if (!pointerCaptureRef.current) return
      const pointerCapture = pointerCaptureRef.current
      if (!pointerCapture.isSamePointer(e.pointerId)) return

      if (!pointerCoordsRef.current) return
      const pointerCoords = pointerCoordsRef.current

      if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

      const pointerPos = { x: e.clientX, y: e.clientY }
      const draggedDistance = pointerCoords.calcDraggedDistance(pointerPos)

      switch (phase) {
        case Phase.Tracking: {
          const highlightedText = window.getSelection()?.toString()
          // user doesn't want to drag, but wants to select text
          if (highlightedText && highlightedText.length > 0) {
            machine.cancelTracking()
            endDragSession()
            return
          }

          const isAcceptedTransition = machine.startDrag({
            draggedDistance,
            dragStartMinDistancePx: DRAG_START_MIN_DISTANCE_PX[e.pointerType],
          })

          if (isAcceptedTransition) {
            // Reset initial position to current so that drawer avoid visual jump
            pointerCoordsRef.current = initPointerCoords(e)
            velocityTrackerRef.current = initVelocityTracker({
              timeStamp: e.timeStamp,
              pointerOffset: 0,
            })
            drawerRectRef.current = rootNode.getBoundingClientRect()

            styleCache.set(rootNode, CONTENT_STYLES_IN_DRAGGING)
            if (overlayRef.current)
              styleCache.set(overlayRef.current, OVERLAY_STYLES_IN_DRAGGING)
          }
          break
        }
        case Phase.Dragging: {
          if (!velocityTrackerRef.current) return
          const velocityTracker = velocityTrackerRef.current
          if (!drawerRectRef.current) return
          const drawerRect = drawerRectRef.current

          const currentSnapRatio = getActiveSnapRatio(snapMode)
          const drawerSize = direction.sizeOnAxis(drawerRect)

          // Rubber band thresholds: free-drag distance before rubber band kicks in.
          // Opening: from current snap point to the maximum snap point.
          //   → 0 at the last snap point (or binary mode) = immediate rubber band.
          // Dismiss: null if dismiss is enabled (no rubber band);
          //   otherwise from current snap point to the minimum snap point.
          //   → 0 at the first snap point = immediate rubber band.
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
            drawerRect,
          })
          dragVisualDistRef.current = dragVisualDist

          velocityTracker.record({
            timeStamp: e.timeStamp,
            pointerOffset: direction.projectOnDismissAxis(draggedDistance),
          })

          // Base offset from snap point (in dismiss-positive space)
          // ratio=1.0 (fully open) → baseOffset=0
          // ratio=0.5 → baseOffset = 50% of drawer size toward dismiss
          const baseOffsetDismissPositive = drawerSize * (1 - currentSnapRatio)
          const totalVisualDist = baseOffsetDismissPositive + dragVisualDist

          const { x, y } = direction.dismissAxisToTranslate(totalVisualDist)
          rootNode.style.transform = `translateX(${x}px) translateY(${y}px)`

          if (overlayRef.current) {
            const currentRatio = 1 - totalVisualDist / drawerSize
            const opacity = Math.min(1, currentRatio)
            overlayRef.current.style.opacity = `${opacity}`
          }
          break
        }
        default:
          const _exhaustiveCheck: never = phase
          return _exhaustiveCheck
      }
    },
    [contentRef, overlayRef, machine, styleCache],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const {
        phase,
        config: { direction },
      } = machine.snapshot

      const rootNode = contentRef.current
      if (!rootNode) return

      if (!pointerCaptureRef.current) return
      const pointerCapture = pointerCaptureRef.current
      if (!pointerCapture.isSamePointer(e.pointerId)) return

      if (!pointerCoordsRef.current) return

      if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

      switch (phase) {
        case Phase.Tracking:
          machine.cancelTracking()
          break
        case Phase.Dragging: {
          // velocityTracker initialize in the transition from Tracking to Dragging,
          // so validate existence in Dragging phase, not in head of the function
          if (!velocityTrackerRef.current) return
          const velocityTracker = velocityTrackerRef.current
          if (dragVisualDistRef.current === null) return // dragVisualDist sometimes set falsy value like 0, so check null explicitly
          const dragVisualDist = dragVisualDistRef.current

          // Suppress click event after dragging to prevent accidental clicks
          e.target.addEventListener(
            'click',
            (event) => {
              event.stopPropagation()
            },
            { once: true, capture: true },
          )

          const velocity = velocityTracker.end(e.timeStamp)

          styleCache.reset(rootNode)
          if (overlayRef.current) styleCache.reset(overlayRef.current)

          // Drawer size is capped at viewport size so dragDistanceRatio stays in a reasonable range
          const drawerSize = direction.sizeOnAxis(
            calculateConstrainedDrawerSize(rootNode.getBoundingClientRect()),
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
          const _exhaustiveCheck: never = phase
          return _exhaustiveCheck
      }

      endDragSession()
    },
    [contentRef, overlayRef, machine, styleCache],
  )

  const cancelGesture = useCallback(() => {
    const { phase } = machine.snapshot
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    switch (phase) {
      case Phase.Tracking:
        machine.cancelTracking()
        break
      case Phase.Dragging:
        if (contentRef.current) styleCache.reset(contentRef.current)
        if (overlayRef.current) styleCache.reset(overlayRef.current)

        machine.cancelDrag()
        break
      default:
        const _exhaustiveCheck: never = phase
        return _exhaustiveCheck
    }

    endDragSession()
  }, [contentRef, overlayRef, machine, styleCache])

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: cancelGesture,
    onContextMenu: cancelGesture,
  }
}

function isDragInteractionAllowed({
  event,
  rootNode,
  targetNode,
}: {
  event: React.PointerEvent
  rootNode: HTMLElement
  targetNode: HTMLElement
}): boolean {
  if (!event.isPrimary) return false

  if (event.button !== 0) return false

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

  let element: HTMLElement | null = targetNode
  while (element) {
    if (
      element.getAttribute('role') === 'dialog' ||
      element === document.documentElement
    ) {
      break
    }

    if (element.scrollHeight > element.clientHeight) {
      if (element.scrollTop !== 0) {
        return false
      }
    }

    element = element.parentElement
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
    target: props.target,
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

function initPointerCoords(event: React.PointerEvent) {
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
