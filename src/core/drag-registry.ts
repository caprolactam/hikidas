import type { DrawerRegistry, DrawerId } from './drawer-registry'
import { getNestingDepth } from './nesting-reducer'
import { scaleForDepth } from './nesting'
import { Phase } from './reducer'

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
 * layer only calls `register()` / cleanup.
 *
 * Current scope (phase 1):
 * - Element instance management (drawerId → HTMLElement)
 * - Ancestor scale interpolation during drag
 *
 * Future scope:
 * - Full drag physics (velocity tracking, rubber band, etc.)
 *   currently handled by useDrawerGesture
 *
 * @internal
 */
export class DragRegistry {
  #instances = new Map<DrawerId, DraggableInstance>()
  #registry: DrawerRegistry

  // ── Active drag state ──────────────────────────────────────

  #activeDrawerId: DrawerId | null = null
  #activePointerId: number | null = null
  #initialPointerPos: { x: number; y: number } | null = null

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
    target.addEventListener('pointercancel', this.#handlePointerUp, {
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

    this.#activeDrawerId = drawerId
    this.#activePointerId = e.pointerId
    this.#initialPointerPos = { x: e.clientX, y: e.clientY }
  }

  #handlePointerMove = (e: PointerEvent): void => {
    if (this.#activePointerId !== e.pointerId) return
    if (!this.#activeDrawerId || !this.#initialPointerPos) return

    const machine = this.#registry.getMachine(this.#activeDrawerId)
    if (!machine || machine.snapshot.phase !== Phase.Dragging) return

    // Resolve ancestors on the first Dragging-phase move
    if (!this.#ancestorCache) {
      this.#resolveAncestors(this.#activeDrawerId)
      if (!this.#ancestorCache!.length) return
    }

    // Compute drag progress from raw pointer distance (no rubber band)
    const { direction } = machine.snapshot.config
    const instance = this.#instances.get(this.#activeDrawerId)!
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

  /**
   * On pointer up, reset drag state.
   *
   * No ancestor scale restoration needed here — that's driven by
   * NestingPhase transitions in DrawerRegistry:
   * - Dismiss (Closing): NestingPhase → Scaling → useNestingAnimation springs to target
   * - Cancel (Settling): NestingPhase → DragRestoring → useNestingAnimation springs back
   *
   * Timing note: useDrawerGesture's element-level pointerup fires before
   * this document-level handler (event bubbling order). By the time this
   * runs, machine.endDrag() has already been called and the phase has
   * transitioned to Closing or Settling, which triggers #onPhaseChange
   * in DrawerRegistry to update the NestingPhase accordingly.
   */
  #handlePointerUp = (e: PointerEvent): void => {
    if (this.#activePointerId !== e.pointerId) return
    this.#resetDragState()
  }

  // ── Ancestor scale control ─────────────────────────────────

  #resolveAncestors(drawerId: DrawerId): void {
    const ancestors = this.#registry.getAncestors(drawerId)
    const resolved: AncestorEntry[] = []

    for (const ancestor of ancestors) {
      const instance = this.#instances.get(ancestor.id)
      if (!instance) continue

      resolved.push({
        id: ancestor.id,
        element: instance.node,
        baseDepth: getNestingDepth(
          this.#registry.getNestingState(ancestor.id),
        ),
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

  // ── State reset ────────────────────────────────────────────

  #resetDragState(): void {
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
      target.removeEventListener('pointercancel', this.#handlePointerUp)
      this.#listenersInitialized = false
    }
    this.#instances.clear()
    this.#resetDragState()
  }
}
