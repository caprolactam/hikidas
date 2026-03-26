import { getNestingDepth } from '../nesting/reducer'
import type { DrawerRegistry, DrawerId } from '../nesting/registry'
import { scaleForDepth } from '../nesting/scale'
import type { DragController } from './controller'

interface AncestorEntry {
  id: DrawerId
  element: HTMLElement
  /** Committed nesting depth at drag start. */
  baseDepth: number
}

/** @internal */
export class DragRegistry {
  #controllers = new Map<DrawerId, DragController>()
  #registry: DrawerRegistry

  constructor(registry: DrawerRegistry) {
    this.#registry = registry
  }

  register(id: DrawerId, controller: DragController): () => void {
    this.#controllers.set(id, controller)

    let ancestorCache: AncestorEntry[] | null = null

    controller.setHooks({
      canStart: () => this.#registry.isFrontmost(id),
      onDragStart: () => {
        ancestorCache = this.#resolveAncestors(id)
      },
      onDragMove: ({ dismissProgress }) => {
        this.#updateAncestorScales(ancestorCache, dismissProgress)
      },
      onDragSessionEnd: () => {
        ancestorCache = null
      },
    })

    return () => {
      controller.dispose()
      this.#controllers.delete(id)
    }
  }

  dispose(): void {
    for (const controller of this.#controllers.values()) {
      controller.dispose()
    }

    this.#controllers.clear()
  }

  #resolveAncestors(drawerId: DrawerId): AncestorEntry[] {
    const ancestors = this.#registry.getAncestors(drawerId)
    const resolved: AncestorEntry[] = []

    for (const ancestor of ancestors) {
      const controller = this.#controllers.get(ancestor.id)
      if (!controller) continue

      resolved.push({
        id: ancestor.id,
        element: controller.element,
        baseDepth: getNestingDepth(ancestor.nesting),
      })
    }

    return resolved
  }

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
}
