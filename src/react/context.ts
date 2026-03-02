import { createContext, useContext } from 'react'
import type {
  DrawerMachine,
  DrawerId,
  DrawerRegistry,
  DragRegistry,
} from '../core'

/** @internal */
export const DrawerRegistryContext = createContext<DrawerRegistry | null>(null)

/** @internal */
export function useDrawerRegistry(): DrawerRegistry {
  const context = useContext(DrawerRegistryContext)
  if (!context) {
    if (__DEV__) {
      throw new Error('Drawer components must be used within a Drawer.Registry')
    } else {
      throw new Error('[Drawer] Invalid usage')
    }
  }
  return context
}

/** @internal */
export const DragRegistryContext = createContext<DragRegistry | null>(null)

/** @internal */
export function useDragRegistry(): DragRegistry {
  const context = useContext(DragRegistryContext)
  if (!context) {
    if (__DEV__) {
      throw new Error('Drawer components must be used within a Drawer.Registry')
    } else {
      throw new Error('[Drawer] Invalid usage')
    }
  }
  return context
}

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
