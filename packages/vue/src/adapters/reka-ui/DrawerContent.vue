<script setup lang="ts">
import { DialogContent } from 'reka-ui'
import { useDrawerContent } from '../../composables'

defineOptions({
  inheritAttrs: false,
})

const { setContentRef } = useDrawerContent()
</script>

<template>
  <DialogContent v-bind="$attrs" :ref="setContentRef" force-mount>
    <slot />
  </DialogContent>
</template>
