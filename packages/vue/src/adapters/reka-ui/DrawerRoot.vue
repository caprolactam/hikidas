<script setup lang="ts">
import { watch } from 'vue'
import { DialogRoot, type DialogRootProps } from 'reka-ui'
import { useDrawerRoot, type DrawerRootAPI } from '../../composables'
import type { DismissalDirection } from '@hikidas/core'

export interface DrawerRootProps extends Omit<
  DialogRootProps,
  'open' | 'defaultOpen'
> {
  defaultOpen?: boolean
  open?: boolean
  dismissalDirection?: DismissalDirection
  disableDragDismiss?: boolean
  snapPoints?: number[]
  defaultSnapPoint?: number
  snapPoint?: number
}

const props = withDefaults(defineProps<DrawerRootProps>(), {
  open: undefined,
  dismissalDirection: 'down',
  disableDragDismiss: false,
  snapPoints: undefined,
  defaultSnapPoint: undefined,
  snapPoint: undefined,
  modal: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:snapPoint': [value: number]
}>()

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
    :modal="$props.modal"
    @update:open="handleIsOpenChange"
  >
    <slot />
  </DialogRoot>
</template>
