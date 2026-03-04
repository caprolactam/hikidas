import type { DrawerMachine } from '../drawer/machine'
import { getNestingDepth } from '../nesting/reducer'
import type { DrawerRegistry, DrawerId } from '../nesting/registry'
import { scaleForDepth } from '../nesting/scale'
import { createDragController } from './controller'

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
 * Nesting-aware drag coordinator.
 *
 * Wraps per-element {@link createDragController} instances with nesting hooks
 * for ancestor scale interpolation and frontmost-drawer gating.
 * Only needed when nesting drawers are used — standalone drawers use
 * {@link createDragController} directly.
 *
 * @internal
 */
export class DragRegistry {
  #instances = new Map<DrawerId, DraggableInstance>()
  #registry: DrawerRegistry

  constructor(registry: DrawerRegistry) {
    this.#registry = registry
  }

  // ── Instance management ────────────────────────────────────

  /**
   * Register a drawer's DOM elements for coordinated drag tracking.
   * Creates a per-element DragController with nesting hooks.
   * Returns an unregister function for cleanup.
   */
  register(
    id: DrawerId,
    instance: DraggableInstance,
    machine: DrawerMachine,
  ): () => void {
    this.#instances.set(id, instance)

    let ancestorCache: AncestorEntry[] | null = null

    const cleanupController = createDragController({
      element: instance.node,
      overlayElement: instance.overlayNode,
      machine,
      hooks: {
        canStart: () => this.#registry.isFrontmost(id),
        onDragStart: () => {
          ancestorCache = this.#resolveAncestors(id)
        },
        onDragProgress: (rawDismissProgress) => {
          this.#updateAncestorScales(ancestorCache, rawDismissProgress)
        },
        onDragSessionEnd: () => {
          ancestorCache = null
        },
      },
    })

    return () => {
      cleanupController()
      this.#instances.delete(id)
    }
  }

  // ── Ancestor scale control ─────────────────────────────────

  #resolveAncestors(drawerId: DrawerId): AncestorEntry[] {
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

    return resolved
  }

  /**
   * Interpolate ancestor scales between their current nesting scale
   * and one level up (as if the child were dismissed).
   *
   * Direct style writes for 60fps performance — no animation framework.
   */
  #updateAncestorScales(
    cache: AncestorEntry[] | null,
    dragProgress: number,
  ): void {
    if (!cache) return

    for (const { element, baseDepth } of cache) {
      const fromScale = scaleForDepth(baseDepth)
      const toScale = scaleForDepth(Math.max(0, baseDepth - 1))
      const scale = fromScale + (toScale - fromScale) * dragProgress
      element.style.scale = String(scale)
    }
  }

  // ── Cleanup ────────────────────────────────────────────────

  dispose(): void {
    this.#instances.clear()
  }
}
