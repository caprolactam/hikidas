import { Phase } from '../drawer/reducer'
import {
  getActiveSnapRatio,
  getMaxSnapRatio,
  getMinSnapRatio,
} from '../drawer/snap-mode'
import { getNestingDepth } from '../nesting/reducer'
import type { DrawerRegistry, DrawerId } from '../nesting/registry'
import { scaleForDepth } from '../nesting/scale'
import { getViewportSize } from '../utils/get-viewport-size'
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

export interface DraggableInstance {
  node: HTMLElement
  overlayNode: HTMLElement | null
}

interface AncestorEntry {
  id: DrawerId
  element: HTMLElement
  /** Committed nesting depth at drag start. */
  baseDepth: number
}

// ── DragRegistry ─────────────────────────────────────────────

/**
 * Manages drag interactions for drawers at the DOM level.
 *
 * Inspired by @neodrag's DraggableFactory: registers a single set of
 * pointer-event listeners on `document.documentElement` and routes events
 * to the appropriate drawer instance. Framework-agnostic — the React
 * (or Vue, Svelte, etc.) layer only calls `register()` / cleanup.
 *
 * Handles:
 * - Pointer event routing via document-level delegation
 * - Tracking → Dragging threshold detection
 * - Drag visual distance (rubber band, clamping) and DOM updates
 * - Velocity tracking and drag end evaluation
 * - Ancestor scale interpolation during drag
 *
 * @internal
 */
export class DragRegistry {
  #instances = new Map<DrawerId, DraggableInstance>()
  #registry: DrawerRegistry

  // ── Active drag state ──────────────────────────────────────

  #activeDrawerId: DrawerId | null = null
  #activePointerId: number | null = null
  /** Pointer position at pointerdown — used for ancestor scale interpolation (never reset). */
  #initialPointerPos: { x: number; y: number } | null = null

  // ── Drag session state ─────────────────────────────────────

  #pointerCapture: PointerCapture | null = null
  /** Pointer coords reset at Tracking→Dragging transition to avoid visual jump. */
  #dragStartCoords: PointerCoords | null = null
  #velocityTracker: VelocityTracker | null = null
  #cachedDrawerRect: DOMRect | null = null
  #dragVisualDist: number | null = null
  #styleCache = initCacheStyling()

  // ── Ancestor scale cache ───────────────────────────────────

  #ancestorCache: AncestorEntry[] | null = null

  // ── Listener lifecycle ─────────────────────────────────────

  #listenersInitialized = false

  constructor(registry: DrawerRegistry) {
    this.#registry = registry
  }

  // ── Instance management ────────────────────────────────────

  /**
   * Register a drawer's DOM elements for drag tracking.
   * Returns an unregister function for cleanup.
   */
  register(id: DrawerId, instance: DraggableInstance): () => void {
    this.#instances.set(id, instance)
    this.#initializeListeners()
    return () => {
      this.#instances.delete(id)
    }
  }

  // ── Document event listeners (@neodrag-style delegation) ───

  #initializeListeners(): void {
    if (this.#listenersInitialized) return

    const target = document.documentElement
    target.addEventListener('pointerdown', this.#handlePointerDown, {
      passive: true,
    })
    target.addEventListener('pointermove', this.#handlePointerMove, {
      passive: false,
    })
    target.addEventListener('pointerup', this.#handlePointerUp, {
      passive: true,
    })
    target.addEventListener('pointercancel', this.#handlePointerCancel, {
      passive: true,
    })
    target.addEventListener('contextmenu', this.#handleContextMenu, {
      passive: true,
    })

    this.#listenersInitialized = true
  }

  // ── Pointer event handlers ─────────────────────────────────

  #handlePointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !e.isPrimary) return

    const drawerId = this.#findTargetDrawer(e)
    if (!drawerId) return
    if (!this.#registry.isFrontmost(drawerId)) return

    const instance = this.#instances.get(drawerId)!
    const targetNode = e.target
    if (!(targetNode instanceof HTMLElement)) return

    if (!isDragInteractionAllowed({ rootNode: instance.node, targetNode })) {
      return
    }

    const machine = this.#registry.getMachine(drawerId)
    if (!machine) return

    const acceptedTransition = machine.startTracking()
    if (!acceptedTransition) return

    this.#activeDrawerId = drawerId
    this.#activePointerId = e.pointerId
    this.#initialPointerPos = { x: e.clientX, y: e.clientY }
    this.#pointerCapture = createPointerCapture({
      target: targetNode,
      pointerId: e.pointerId,
    })
    this.#dragStartCoords = initPointerCoords(e)
  }

  #handlePointerMove = (e: PointerEvent): void => {
    if (this.#activePointerId !== e.pointerId) return
    if (!this.#activeDrawerId || !this.#initialPointerPos) return

    if (!this.#pointerCapture?.isSamePointer(e.pointerId)) return
    if (!this.#dragStartCoords) return

    const machine = this.#registry.getMachine(this.#activeDrawerId)
    if (!machine) return

    const {
      phase,
      snapMode,
      config: { direction, disableDragDismiss },
    } = machine.snapshot

    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) return

    const instance = this.#instances.get(this.#activeDrawerId)!
    const pointerPos = { x: e.clientX, y: e.clientY }
    const draggedDistance =
      this.#dragStartCoords.calcDraggedDistance(pointerPos)

    switch (phase) {
      case Phase.Tracking: {
        const highlightedText = window.getSelection()?.toString()
        // User doesn't want to drag, but wants to select text
        if (highlightedText && highlightedText.length > 0) {
          machine.cancelTracking()
          this.#endDragSession()
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
          this.#dragStartCoords = initPointerCoords(e)
          this.#velocityTracker = initVelocityTracker({
            timeStamp: e.timeStamp,
            pointerOffset: 0,
          })
          this.#cachedDrawerRect = instance.node.getBoundingClientRect()

          this.#styleCache.set(instance.node, CONTENT_STYLES_IN_DRAGGING)
          if (instance.overlayNode) {
            this.#styleCache.set(
              instance.overlayNode,
              OVERLAY_STYLES_IN_DRAGGING,
            )
          }
        }
        break
      }
      case Phase.Dragging: {
        if (!this.#velocityTracker) return
        if (!this.#cachedDrawerRect) return

        const currentSnapRatio = getActiveSnapRatio(snapMode)
        const drawerSize = direction.sizeOnAxis(this.#cachedDrawerRect)

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
          drawerRect: this.#cachedDrawerRect,
        })
        this.#dragVisualDist = dragVisualDist

        this.#velocityTracker.record({
          timeStamp: e.timeStamp,
          pointerOffset: direction.projectOnDismissAxis(draggedDistance),
        })

        // Base offset from snap point (in dismiss-positive space)
        // ratio=1.0 (fully open) → baseOffset=0
        // ratio=0.5 → baseOffset = 50% of drawer size toward dismiss
        const baseOffsetDismissPositive = drawerSize * (1 - currentSnapRatio)
        const totalVisualDist = baseOffsetDismissPositive + dragVisualDist

        const { x, y } = direction.dismissAxisToTranslate(totalVisualDist)
        instance.node.style.transform = `translateX(${x}px) translateY(${y}px)`

        if (instance.overlayNode) {
          const currentRatio = 1 - totalVisualDist / drawerSize
          const opacity = Math.min(1, currentRatio)
          instance.overlayNode.style.opacity = `${opacity}`
        }

        // ── Ancestor scale interpolation ──────────────────────
        this.#updateAncestorScalesFromPointer(e, direction, instance)

        break
      }
      default:
        phase satisfies never
    }
  }

  #handlePointerUp = (e: PointerEvent): void => {
    if (this.#activePointerId !== e.pointerId) return
    if (!this.#activeDrawerId) return

    const machine = this.#registry.getMachine(this.#activeDrawerId)
    if (!machine) {
      this.#endDragSession()
      return
    }

    const {
      phase,
      config: { direction },
    } = machine.snapshot

    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) {
      this.#endDragSession()
      return
    }

    const instance = this.#instances.get(this.#activeDrawerId)!

    switch (phase) {
      case Phase.Tracking:
        machine.cancelTracking()
        break
      case Phase.Dragging: {
        // velocityTracker initialized in the transition from Tracking to Dragging,
        // so validate existence in Dragging phase, not at head of the function
        if (!this.#velocityTracker) return
        // dragVisualDist sometimes set to falsy value like 0, so check null explicitly
        if (this.#dragVisualDist === null) return

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

        const velocity = this.#velocityTracker.end(e.timeStamp)

        this.#styleCache.reset(instance.node)
        if (instance.overlayNode) {
          this.#styleCache.reset(instance.overlayNode)
        }

        // Drawer size is capped at viewport size so dragDistanceRatio stays in a reasonable range
        const drawerSize = direction.sizeOnAxis(
          calculateConstrainedDrawerSize(instance.node.getBoundingClientRect()),
        )
        const dragDistanceRatio =
          drawerSize === 0 ? 0 : this.#dragVisualDist / drawerSize

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

    this.#endDragSession()
  }

  #handlePointerCancel = (e: PointerEvent): void => {
    if (this.#activePointerId !== e.pointerId) return
    this.#cancelGesture()
  }

  #handleContextMenu = (): void => {
    if (this.#activeDrawerId === null) return
    this.#cancelGesture()
  }

  // ── Gesture cancellation ────────────────────────────────────

  #cancelGesture(): void {
    if (!this.#activeDrawerId) return

    const machine = this.#registry.getMachine(this.#activeDrawerId)
    if (!machine) {
      this.#endDragSession()
      return
    }

    const { phase } = machine.snapshot
    if (!(phase === Phase.Tracking || phase === Phase.Dragging)) {
      this.#endDragSession()
      return
    }

    const instance = this.#instances.get(this.#activeDrawerId)!

    switch (phase) {
      case Phase.Tracking:
        machine.cancelTracking()
        break
      case Phase.Dragging:
        this.#styleCache.reset(instance.node)
        if (instance.overlayNode) {
          this.#styleCache.reset(instance.overlayNode)
        }
        machine.cancelDrag()
        break
      default:
        phase satisfies never
    }

    this.#endDragSession()
  }

  // ── Ancestor scale control ─────────────────────────────────

  /**
   * Compute drag progress from raw pointer distance and update ancestor scales.
   * Uses #initialPointerPos (set at pointerdown, never reset) for raw distance.
   */
  #updateAncestorScalesFromPointer(
    e: PointerEvent,
    direction: {
      projectOnDismissAxis: (d: { x: number; y: number }) => number
      sizeOnAxis: (r: DOMRect) => number
    },
    instance: DraggableInstance,
  ): void {
    if (!this.#initialPointerPos) return

    // Resolve ancestors on the first Dragging-phase move
    if (!this.#ancestorCache) {
      this.#resolveAncestors(this.#activeDrawerId!)
      if (!this.#ancestorCache!.length) return
    }

    const drawerSize = direction.sizeOnAxis(
      instance.node.getBoundingClientRect(),
    )

    const pointerDelta = {
      x: e.clientX - this.#initialPointerPos.x,
      y: e.clientY - this.#initialPointerPos.y,
    }
    const dismissDist = direction.projectOnDismissAxis(pointerDelta)
    const dragProgress = Math.max(0, Math.min(1, dismissDist / drawerSize))

    this.#updateAncestorScales(dragProgress)
  }

  #resolveAncestors(drawerId: DrawerId): void {
    const ancestors = this.#registry.getAncestors(drawerId)
    const resolved: AncestorEntry[] = []

    for (const ancestor of ancestors) {
      const instance = this.#instances.get(ancestor.id)
      if (!instance) continue

      resolved.push({
        id: ancestor.id,
        element: instance.node,
        baseDepth: getNestingDepth(this.#registry.getNestingState(ancestor.id)),
      })
    }

    this.#ancestorCache = resolved
  }

  /**
   * Interpolate ancestor scales between their current nesting scale
   * and one level up (as if the child were dismissed).
   *
   * Direct style writes for 60fps performance — no animation framework.
   */
  #updateAncestorScales(dragProgress: number): void {
    if (!this.#ancestorCache) return

    for (const { element, baseDepth } of this.#ancestorCache) {
      const fromScale = scaleForDepth(baseDepth)
      const toScale = scaleForDepth(Math.max(0, baseDepth - 1))
      const scale = fromScale + (toScale - fromScale) * dragProgress
      element.style.scale = String(scale)
    }
  }

  // ── Target drawer lookup (@neodrag's #find_draggable_node) ─

  #findTargetDrawer(e: PointerEvent): DrawerId | null {
    const path = e.composedPath()
    const maxDepth = Math.min(path.length, 20)

    for (let i = 0; i < maxDepth; i++) {
      const el = path[i]
      if (!(el instanceof HTMLElement)) continue

      for (const [id, instance] of this.#instances) {
        if (instance.node === el) return id
      }
    }

    return null
  }

  // ── Session cleanup ─────────────────────────────────────────

  #endDragSession(): void {
    this.#pointerCapture?.release()
    this.#pointerCapture = null
    this.#dragStartCoords = null
    this.#velocityTracker?.cancel()
    this.#velocityTracker = null
    this.#cachedDrawerRect = null
    this.#dragVisualDist = null
    this.#activeDrawerId = null
    this.#activePointerId = null
    this.#initialPointerPos = null
    this.#ancestorCache = null
  }

  // ── Cleanup ────────────────────────────────────────────────

  dispose(): void {
    if (this.#listenersInitialized) {
      const target = document.documentElement
      target.removeEventListener('pointerdown', this.#handlePointerDown)
      target.removeEventListener('pointermove', this.#handlePointerMove)
      target.removeEventListener('pointerup', this.#handlePointerUp)
      target.removeEventListener('pointercancel', this.#handlePointerCancel)
      target.removeEventListener('contextmenu', this.#handleContextMenu)
      this.#listenersInitialized = false
    }
    this.#instances.clear()
    this.#endDragSession()
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
