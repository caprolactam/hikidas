import { Dialog } from 'radix-ui'
import type React from 'react'
import {
  useDrawerContent,
  useDrawerOverlay,
  DrawerProvider,
  type DrawerRootAPI,
} from '../../react/drawer-adapter'

export interface DrawerRootProps
  extends
    DrawerRootAPI,
    Omit<
      React.ComponentPropsWithRef<typeof Dialog.Root>,
      'defaultOpen' | 'open' | 'onOpenChange'
    > {}

export function DrawerRoot({
  defaultOpen,
  open,
  onOpenChange,
  dismissalDirection,
  disableDragDismiss,
  snapPoints,
  defaultSnapPoint,
  snapPoint,
  onSnapPointChange,
  ...props
}: DrawerRootProps) {
  return (
    <DrawerProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      dismissalDirection={dismissalDirection}
      disableDragDismiss={disableDragDismiss}
      snapPoints={snapPoints}
      defaultSnapPoint={defaultSnapPoint}
      snapPoint={snapPoint}
      onSnapPointChange={onSnapPointChange}
    >
      {({ isOpen, handleIsOpenChange }) => (
        <Dialog.Root
          open={isOpen}
          onOpenChange={handleIsOpenChange}
          {...props}
        />
      )}
    </DrawerProvider>
  )
}

export interface DrawerOverlayProps extends Omit<
  React.ComponentPropsWithRef<typeof Dialog.Overlay>,
  'forceMount'
> {}

export function DrawerOverlay({ ref, ...props }: DrawerOverlayProps) {
  const overlayProps = useDrawerOverlay(ref)

  return <Dialog.Overlay {...props} {...overlayProps} />
}

export interface DrawerContentProps extends Omit<
  React.ComponentPropsWithRef<typeof Dialog.Content>,
  'forceMount'
> {}

export function DrawerContent({ style, ref, ...props }: DrawerContentProps) {
  const contentProps = useDrawerContent({
    ref,
    style,
  })

  return <Dialog.Content {...props} {...contentProps} />
}

export interface DrawerTriggerProps extends React.ComponentPropsWithRef<
  typeof Dialog.Trigger
> {}

export const DrawerTrigger = Dialog.Trigger

export interface DrawerPortalProps extends Omit<
  React.ComponentPropsWithRef<typeof Dialog.Portal>,
  'forceMount'
> {}
export function DrawerPortal(props: DrawerPortalProps) {
  return <Dialog.Portal {...props} />
}

export interface DrawerCloseProps extends React.ComponentPropsWithRef<
  typeof Dialog.Close
> {}

export const DrawerClose = Dialog.Close

export interface DrawerTitleProps extends React.ComponentPropsWithRef<
  typeof Dialog.Title
> {}

export const DrawerTitle = Dialog.Title

export interface DrawerDescriptionProps extends React.ComponentPropsWithRef<
  typeof Dialog.Description
> {}

export const DrawerDescription = Dialog.Description

export const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Portal: DrawerPortal,
  Overlay: DrawerOverlay,
  Content: DrawerContent,
  Close: DrawerClose,
  Title: DrawerTitle,
  Description: DrawerDescription,
}
