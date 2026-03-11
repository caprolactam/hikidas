<script setup lang="ts">
import { DialogContent, useForwardExpose } from 'reka-ui'
import { useDrawerContent } from '../../composables'

defineOptions({
  inheritAttrs: false,
})

const { forwardRef, currentElement } = useForwardExpose()
useDrawerContent(currentElement)
</script>

<template>
  <DialogContent v-bind="$attrs" :ref="forwardRef" force-mount>
    <slot />
  </DialogContent>
</template>
