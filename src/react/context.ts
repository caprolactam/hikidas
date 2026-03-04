import { createContext, useContext } from 'react'
import type {
  DrawerMachine,
  DrawerId,
  DrawerRegistry,
} from '../core'

// ── DragSetup ─────────────────────────────────────────────────

/**
 * Factory function provided by NestingDrawerProvider.
 * Sets up coordinated drag handling and nesting animation for a drawer element.
 * Returns a cleanup function.
 *
 * @internal
 */
export type DragSetup = (params: {
  id: DrawerId
  element: HTMLElement
  overlayElement: HTMLElement | null
  machine: DrawerMachine
}) => () => void

/** @internal */
export const DragSetupContext = createContext<DragSetup | null>(null)

// ── DrawerRegistryContext ─────────────────────────────────────

/** @internal */
export const DrawerRegistryContext = createContext<DrawerRegistry | null>(null)

/** @internal — Returns null when no NestingDrawerProvider is present. */
export function useDrawerRegistryOptional(): DrawerRegistry | null {
  return useContext(DrawerRegistryContext)
}

/** @internal — Throws if no NestingDrawerProvider is present. */
export function useDrawerRegistry(): DrawerRegistry {
  const context = useContext(DrawerRegistryContext)
  if (!context) {
    if (__DEV__) {
      throw new Error('Drawer components must be used within a Drawer.NestingProvider')
    } else {
      throw new Error('[Drawer] Invalid usage')
    }
  }
  return context
}

// ── DrawerContext ────────────────────────────────────────────

/** @internal */
export interface DrawerContextValue {
  id: DrawerId
  machine: DrawerMachine
  contentRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
}

/** @internal */
export const DrawerContext = createContext<DrawerContextValue | null>(null)

/** @internal */
export function useDrawerContext() {
  const context = useContext(DrawerContext)
  if (!context) {
    if (__DEV__) {
      throw new Error('Drawer components must be used within a Drawer.Root')
    } else {
      throw new Error('[Drawer] Invalid usage')
    }
  }
  return context
}

/** @internal */
export function useParentDrawerId(): DrawerId | null {
  const parentContext = useContext(DrawerContext)

  return parentContext ? parentContext.id : null
}
