<script setup lang="ts">
import { DialogOverlay, useForwardExpose } from 'reka-ui'
import { useDrawerOverlay } from '../../composables'

defineOptions({
  inheritAttrs: false,
})

const { forwardRef, currentElement } = useForwardExpose()
useDrawerOverlay(currentElement)
</script>

<template>
  <DialogOverlay v-bind="$attrs" :ref="forwardRef" force-mount />
</template>
