<script setup lang="ts">
import { provide, onBeforeUnmount } from 'vue'
import {
  DrawerRegistry,
  DragRegistry,
  setupNestingAnimation,
} from '@hikidas/core'
import { NestingKey, type NestingConnector } from './context'

const drawerRegistry = new DrawerRegistry()
const dragRegistry = new DragRegistry(drawerRegistry)

onBeforeUnmount(() => {
  dragRegistry.dispose()
})

const connector: NestingConnector = (params) => {
  const cleanupDrag = dragRegistry.register(params.id, params.controller)
  const cleanupNesting = setupNestingAnimation({
    registry: drawerRegistry,
    drawerId: params.id,
    element: params.element,
  })
  return () => {
    cleanupDrag()
    cleanupNesting()
  }
}

provide(NestingKey, { registry: drawerRegistry, connector })
</script>

<template>
  <slot />
</template>
