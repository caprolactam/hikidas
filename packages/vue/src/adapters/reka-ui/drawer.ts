import {
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import DrawerRoot from './DrawerRoot.vue'
import DrawerOverlay from './DrawerOverlay.vue'
import DrawerContent from './DrawerContent.vue'
import NestingDrawerProvider from '../../NestingDrawerProvider.vue'

export const DrawerTrigger = DialogTrigger
export const DrawerPortal = DialogPortal
export const DrawerClose = DialogClose
export const DrawerTitle = DialogTitle
export const DrawerDescription = DialogDescription

export { DrawerRoot, DrawerOverlay, DrawerContent, NestingDrawerProvider }

export type { DrawerRootProps } from './DrawerRoot.vue'

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
