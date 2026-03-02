import { createContext, useContext } from 'react'
import { DrawerRegistry, type DragRegistry, type DrawerId } from '../core'

// ── DrawerRegistry Context ───────────────────────────────

/** @internal */
export const DrawerRegistryContext = createContext<DrawerRegistry | null>(null)

/**
 * Returns the DrawerRegistry from context, or null if no DrawerRegistryProvider
 * is present. This makes registry integration opt-in — drawers function
 * independently when no registry is provided.
 *
 * @internal
 */
export function useDrawerRegistry(): DrawerRegistry | null {
  return useContext(DrawerRegistryContext)
}

// ── DrawerId Context ─────────────────────────────────────

/**
 * Context for propagating the current drawer's id down the component tree.
 * When a nested DrawerProvider reads this context, it uses the value as its
 * parentId, building the tree structure via React component hierarchy rather
 * than DOM relationships.
 *
 * @internal
 */
export const DrawerIdContext = createContext<DrawerId | null>(null)

/**
 * Returns the nearest ancestor drawer's id, or null if there is none.
 * Used by DrawerProvider to automatically resolve parentId for registration.
 *
 * @internal
 */
export function useParentDrawerId(): DrawerId | null {
  return useContext(DrawerIdContext)
}

// ── DragRegistry Context ─────────────────────────────────

/** @internal */
export const DragRegistryContext = createContext<DragRegistry | null>(null)

/**
 * Returns the DragRegistry from context, or null if no DrawerRegistryProvider
 * is present. Opt-in — drawers function independently without it.
 *
 * @internal
 */
export function useDragRegistry(): DragRegistry | null {
  return useContext(DragRegistryContext)
}
