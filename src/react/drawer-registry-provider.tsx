import React from 'react'
import { DrawerRegistry } from '../core/drawer-registry'
import { DrawerRegistryContext } from './drawer-registry-context'
import { useStatic } from './utils/use-static'

interface DrawerRegistryProviderProps {
  children: React.ReactNode
  /**
   * Optional externally-created DrawerRegistry instance.
   * If omitted, a new instance is created internally.
   * Providing your own instance is useful for imperative access outside React.
   */
  registry?: DrawerRegistry
}

/**
 * Provides a DrawerRegistry to all descendant Drawer components.
 * Nest this once near the root of your app to enable multi-drawer
 * features such as tree queries (getChildren, getAncestors, getFrontmostOpen).
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
  registry: externalRegistry,
}: DrawerRegistryProviderProps) {
  const internalRegistry = useStatic(() => new DrawerRegistry())
  const registry = externalRegistry ?? internalRegistry

  return (
    <DrawerRegistryContext value={registry}>{children}</DrawerRegistryContext>
  )
}
