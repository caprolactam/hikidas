<script lang="ts">
import type { DialogRootProps } from 'reka-ui'
import type { DrawerRootAPI, DrawerRootEmit } from '../../composables'

export interface DrawerRootProps
  extends Omit<DialogRootProps, 'open' | 'defaultOpen'>, DrawerRootAPI {}

export type { DrawerRootEmit }
</script>

<script setup lang="ts">
import { DialogRoot } from 'reka-ui'
import { watch } from 'vue'
import { useDrawerRoot } from '../../composables'

const props = withDefaults(defineProps<DrawerRootProps>(), {
  modal: true,
})

const emit = defineEmits<DrawerRootEmit>()

const { isOpen, handleIsOpenChange } = useDrawerRoot(props, emit)

if (__DEV__) {
  watch(
    () => props.snapPoints,
    (snapPoints) => {
      if (!snapPoints || snapPoints.length === 0) return

      if (snapPoints.some((p) => p <= 0 || p > 1)) {
        console.warn(
          '[Drawer] snapPoints must be in range greater than 0 and less than or equal to 1. Found:',
          snapPoints,
        )
      }

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
    },
    { immediate: true },
  )
}
</script>

<template>
  <DialogRoot
    :open="isOpen"
    :modal="props.modal"
    @update:open="handleIsOpenChange"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </DialogRoot>
</template>
