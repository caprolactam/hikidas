import { createContext, useContext } from 'react'
import type { DrawerMachine } from '../core/drawer-machine'

/** @internal */
export interface DrawerContextValue {
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
