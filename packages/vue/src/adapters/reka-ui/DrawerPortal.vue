<script lang="ts">
import type { DialogPortalProps } from 'reka-ui'

export interface DrawerPortalProps extends DialogPortalProps {}
</script>

<script setup lang="ts">
import { DialogPortal } from 'reka-ui'
import { useDrawerContext } from '../../context'

defineProps<DrawerPortalProps>()

const { shouldMount } = useDrawerContext()
</script>

<template>
  <DialogPortal v-bind="$props">
    <slot v-if="shouldMount" />
  </DialogPortal>
</template>
