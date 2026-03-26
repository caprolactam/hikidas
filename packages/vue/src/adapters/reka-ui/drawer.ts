import {
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import NestingDrawerProvider from '../../NestingDrawerProvider.vue'
import DrawerContent from './DrawerContent.vue'
import DrawerOverlay from './DrawerOverlay.vue'
import DrawerPortal from './DrawerPortal.vue'
import DrawerRoot from './DrawerRoot.vue'

export const DrawerTrigger = DialogTrigger
export const DrawerClose = DialogClose
export const DrawerTitle = DialogTitle
export const DrawerDescription = DialogDescription

export {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  NestingDrawerProvider,
}

export type { DrawerRootProps } from './DrawerRoot.vue'
export type { DrawerPortalProps } from './DrawerPortal.vue'
export type { DrawerOverlayProps } from './DrawerOverlay.vue'
export type {
  DrawerContentProps,
  DrawerContentEmits,
} from './DrawerContent.vue'

export const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Portal: DrawerPortal,
  Overlay: DrawerOverlay,
  Content: DrawerContent,
  Close: DrawerClose,
  Title: DrawerTitle,
  Description: DrawerDescription,
} as const
