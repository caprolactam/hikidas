<script setup lang="ts">
import {
  DrawerRoot,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from '@hikidas/vue/reka-ui'
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <DrawerRoot>
      <DrawerTrigger
        class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Open Drawer
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 bg-black/50" />
        <DrawerContent
          class="fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200"
        >
          <div class="flex justify-center pt-3 pb-2" data-testid="drag-handle">
            <div class="h-1 w-12 rounded-full bg-slate-300" />
          </div>
          <div class="space-y-4 px-6 pb-6">
            <DrawerTitle class="text-lg font-semibold">
              Reka UI Adapter
            </DrawerTitle>
            <DrawerDescription class="text-sm leading-relaxed text-slate-600">
              Smoke test for the Reka UI adapter. Open, drag, and close should
              all work correctly.
            </DrawerDescription>
            <DrawerClose
              class="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </DrawerClose>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  </div>
</template>
