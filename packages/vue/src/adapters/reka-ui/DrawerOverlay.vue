<script setup lang="ts">
import { DialogOverlay } from 'reka-ui'
import { useDrawerOverlay } from '../../composables'

defineOptions({
  inheritAttrs: false,
})

const { setOverlayRef } = useDrawerOverlay()
</script>

<template>
  <DialogOverlay v-bind="$attrs" :ref="setOverlayRef" force-mount />
</template>
