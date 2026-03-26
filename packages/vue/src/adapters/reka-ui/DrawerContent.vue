<script lang="ts">
import type { DialogContentProps, DialogContentEmits } from 'reka-ui'

export type DrawerContentProps = Omit<DialogContentProps, 'forceMount'>

export type DrawerContentEmits = DialogContentEmits
</script>

<script setup lang="ts">
import { DialogContent, useForwardExpose, useEmitAsProps } from 'reka-ui'
import { useDrawerContent } from '../../composables'

defineProps<DrawerContentProps>()

defineOptions({
  inheritAttrs: false,
})

const emits = defineEmits<DrawerContentEmits>()
const emitsAsProps = useEmitAsProps(emits)

const { forwardRef, currentElement } = useForwardExpose()
useDrawerContent(currentElement)
</script>

<template>
  <DialogContent
    v-bind="{ ...$attrs, ...$props, ...emitsAsProps }"
    :force-mount="true"
    :ref="forwardRef"
  >
    <slot />
  </DialogContent>
</template>
