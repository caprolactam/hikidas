<script lang="ts">
import type { DialogOverlayProps } from 'reka-ui'

export interface DrawerOverlayProps extends Omit<
  DialogOverlayProps,
  'forceMount'
> {}
</script>

<script setup lang="ts">
import { DialogOverlay, useForwardExpose } from 'reka-ui'
import { useDrawerOverlay } from '../../composables'

defineProps<DrawerOverlayProps>()

defineOptions({
  inheritAttrs: false,
})

const { forwardRef, currentElement } = useForwardExpose()
useDrawerOverlay(currentElement)
</script>

<template>
  <DialogOverlay
    v-bind="{ ...$attrs, ...$props }"
    :force-mount="true"
    :ref="forwardRef"
  >
    <slot />
  </DialogOverlay>
</template>
