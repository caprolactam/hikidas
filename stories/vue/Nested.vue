<script setup lang="ts">
import {
  DrawerRoot,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  NestingDrawerProvider,
} from '../../packages/vue/src/adapters/reka-ui'
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <NestingDrawerProvider>
      <DrawerRoot>
        <DrawerTrigger
          class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Open Parent
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay class="fixed inset-0 bg-black/50" />
          <DrawerContent
            class="fixed bottom-0 inset-x-0 bg-white h-[75vh] rounded-t-3xl border border-slate-200 after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:pointer-events-none after:transition-[background-color] after:duration-200 after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5"
          >
            <div
              class="flex justify-center pt-3 pb-2"
              data-testid="drag-handle"
            >
              <div class="h-1 w-12 rounded-full bg-slate-300" />
            </div>
            <div class="space-y-4 px-6 pb-6">
              <DrawerTitle class="text-lg font-semibold">
                Parent Drawer
              </DrawerTitle>

              <DrawerRoot>
                <DrawerTrigger
                  class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Open Child
                </DrawerTrigger>
                <DrawerPortal>
                  <DrawerContent
                    class="fixed bottom-0 inset-x-0 bg-white h-[65vh] rounded-t-3xl border border-slate-200"
                  >
                    <div
                      class="flex justify-center pt-3 pb-2"
                      data-testid="drag-handle"
                    >
                      <div class="h-1 w-12 rounded-full bg-slate-300" />
                    </div>
                    <div class="space-y-4 px-6 pb-6">
                      <DrawerTitle class="text-lg font-semibold">
                        Child Drawer
                      </DrawerTitle>
                      <DrawerClose
                        class="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Close Child
                      </DrawerClose>
                    </div>
                  </DrawerContent>
                </DrawerPortal>
              </DrawerRoot>

              <DrawerClose
                class="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close Parent
              </DrawerClose>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </NestingDrawerProvider>
  </div>
</template>
