import React, { useCallback, useEffect } from 'react'
import { DragController, DragRegistry, DrawerRegistry } from '../core'
import {
  DrawerRegistryContext,
  DragSetupContext,
  type DragSetup,
  DrawerContext,
} from './context'
import { setupNestingAnimation } from './setup-nesting-animation'
import { useDrawerRoot, type DrawerRootAPI } from './use-drawer'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'
import { useStatic } from './utils/use-static'

interface NestingDrawerProviderProps {
  children: React.ReactNode
}

/**
 * Provides nesting support for descendant Drawer components.
 * Wrap this around your app (or a subtree) to enable nested drawer features:
 * tree queries (getChildren, getAncestors, getFrontmostOpen),
 * drag-time ancestor scale interpolation, and cascade close.
 *
 * When no NestingDrawerProvider is present, drawers function independently —
 * the nesting integration is fully opt-in and tree-shakeable.
 *
 * @example
 * ```tsx
 * import { NestingDrawerProvider } from 'hikidas/react'
 *
 * function App() {
 *   return (
 *     <NestingDrawerProvider>
 *       <Drawer.Root>...</Drawer.Root>
 *       <Drawer.Root>
 *         <Drawer.Root>...</Drawer.Root> // nested
 *       </Drawer.Root>
 *     </NestingDrawerProvider>
 *   )
 * }
 * ```
 */
export function NestingDrawerProvider({
  children,
}: NestingDrawerProviderProps) {
  const drawerRegistry = useStatic(() => new DrawerRegistry())
  const dragRegistry = useStatic(() => new DragRegistry(drawerRegistry))

  useIsomorphicEffect(() => {
    return () => dragRegistry.dispose()
  }, [dragRegistry])

  const dragSetup: DragSetup = useCallback(
    (params) => {
      const controller = new DragController({
        element: params.element,
        overlayElement: params.overlayElement,
        machine: params.machine,
      })
      const cleanupDrag = dragRegistry.register(params.id, controller)
      const cleanupNesting = setupNestingAnimation({
        registry: drawerRegistry,
        drawerId: params.id,
        element: params.element,
      })
      return () => {
        cleanupDrag()
        cleanupNesting()
      }
    },
    [dragRegistry, drawerRegistry],
  )

  return (
    <DrawerRegistryContext value={drawerRegistry}>
      <DragSetupContext value={dragSetup}>{children}</DragSetupContext>
    </DrawerRegistryContext>
  )
}

/** @deprecated Use {@link NestingDrawerProvider} instead. */
export const DrawerRegistryProvider = NestingDrawerProvider

interface DrawerProviderAPI {
  isOpen: boolean
  handleIsOpenChange: (open: boolean) => void
}
interface DrawerProviderProps extends DrawerRootAPI {
  children: (api: DrawerProviderAPI) => React.ReactNode
}

export function DrawerProvider({ children, ...props }: DrawerProviderProps) {
  const { isOpen, handleIsOpenChange, contextValue } = useDrawerRoot(props)

  return (
    <DrawerContext value={contextValue}>
      {children({ isOpen, handleIsOpenChange })}
      {__DEV__ ? <SnapPointsWarning snapPoints={props.snapPoints} /> : null}
    </DrawerContext>
  )
}

function SnapPointsWarning({ snapPoints }: Pick<DrawerRootAPI, 'snapPoints'>) {
  const isBinaryMode = !snapPoints || snapPoints.length === 0

  useEffect(() => {
    if (isBinaryMode) return

    // Validate range
    if (snapPoints.some((p) => p <= 0 || p > 1)) {
      console.warn(
        '[Drawer] snapPoints must be in range greater than 0 and less than or equal to 1. Found:',
        snapPoints,
      )
    }

    // Validate ascending order
    if (snapPoints.length <= 1) return
    for (let i = 1; i < snapPoints.length; i++) {
      if (snapPoints[i]! <= snapPoints[i - 1]!) {
        console.warn(
          '[Drawer] snapPoints must be in ascending order. Found:',
          snapPoints,
        )
        break
      }
    }
  }, [snapPoints, isBinaryMode])

  return null
}
