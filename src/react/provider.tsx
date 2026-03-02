import React, { useEffect } from 'react'
import { DragRegistry, DrawerRegistry } from '../core'
import {
  DragRegistryContext,
  DrawerRegistryContext,
  DrawerContext,
} from './context'
import { useDrawerRoot, type DrawerRootAPI } from './use-drawer'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'
import { useStatic } from './utils/use-static'

interface DrawerRegistryProviderProps {
  children: React.ReactNode
}

/**
 * Provides a DrawerRegistry and DragRegistry to all descendant Drawer components.
 * Nest this once near the root of your app to enable multi-drawer
 * features such as tree queries (getChildren, getAncestors, getFrontmostOpen)
 * and drag-time ancestor scale interpolation.
 *
 * When no DrawerRegistryProvider is present, drawers function independently —
 * the integration is fully opt-in.
 *
 * @example
 * ```tsx
 * import { DrawerRegistryProvider } from 'hikidas/react'
 *
 * function App() {
 *   return (
 *     <DrawerRegistryProvider>
 *       <Drawer.Root>...</Drawer.Root>
 *       <Drawer.Root>
 *         <Drawer.Root>...</Drawer.Root> // nested
 *       </Drawer.Root>
 *     </DrawerRegistryProvider>
 *   )
 * }
 * ```
 */
export function DrawerRegistryProvider({
  children,
}: DrawerRegistryProviderProps) {
  const drawerRegistry = useStatic(() => new DrawerRegistry())
  const dragRegistry = useStatic(() => new DragRegistry(drawerRegistry))

  useIsomorphicEffect(() => {
    return dragRegistry.dispose.bind(dragRegistry)
  }, [dragRegistry])

  return (
    <DrawerRegistryContext value={drawerRegistry}>
      <DragRegistryContext value={dragRegistry}>{children}</DragRegistryContext>
    </DrawerRegistryContext>
  )
}

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
