import { inject, type InjectionKey, type ShallowRef } from 'vue'
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
export const NestingKey: InjectionKey<NestingContextValue> =
  Symbol('HikidasNesting')

/** @internal */
export interface DrawerContextValue {
  id: DrawerId
  machine: DrawerMachine
  contentRef: ShallowRef<HTMLElement | null>
  overlayRef: ShallowRef<HTMLElement | null>
  nestingConnector: NestingConnector | null
}

/** @internal */
export const DrawerKey: InjectionKey<DrawerContextValue> =
  Symbol('HikidasDrawer')

/** @internal */
export function useDrawerContext(): DrawerContextValue {
  const context = inject(DrawerKey)
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
  const parentContext = inject(DrawerKey, null)
  return parentContext ? parentContext.id : null
}
