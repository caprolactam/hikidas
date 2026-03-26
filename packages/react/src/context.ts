import { createContext, useContext } from 'react'
import type {
  DrawerMachine,
  DrawerId,
  DrawerRegistry,
  DragController,
} from '@hikidas/core'

/**
 * Connects a drawer's content element and drag controller into the nesting
 * coordination system (drag registry + nesting animation).
 * Returns a cleanup function that disconnects when the element unmounts.
 *
 * @internal
 */
export type NestingConnector = (params: {
  id: DrawerId
  element: HTMLElement
  controller: DragController
}) => () => void

/** @internal */
export interface NestingContextValue {
  registry: DrawerRegistry
  connector: NestingConnector
}

/** @internal */
export const NestingContext = createContext<NestingContextValue | null>(null)

/** @internal */
export interface DrawerContextValue {
  id: DrawerId
  machine: DrawerMachine
  contentRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
  nestingConnector: NestingConnector | null
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
