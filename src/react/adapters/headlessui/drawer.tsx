import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react'
import type React from 'react'
import { DrawerRegistryProvider, DrawerProvider } from '../../provider'
import {
  useDrawerContent,
  useDrawerOverlay,
  type DrawerRootAPI,
} from '../../use-drawer'

export { DrawerRegistryProvider }

export interface DrawerRootProps
  extends
    Omit<DrawerRootAPI, 'defaultOpen' | 'open' | 'onOpenChange'>,
    Omit<
      React.ComponentPropsWithRef<typeof Dialog>,
      'open' | 'onClose' | 'static' | 'unmount' | 'transition'
    > {
  open: boolean
  onClose: (value: false) => void
}

export function DrawerRoot({
  open,
  onClose,
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
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose(false)
      }}
      dismissalDirection={dismissalDirection}
      disableDragDismiss={disableDragDismiss}
      snapPoints={snapPoints}
      defaultSnapPoint={defaultSnapPoint}
      snapPoint={snapPoint}
      onSnapPointChange={onSnapPointChange}
    >
      {({ isOpen, handleIsOpenChange }) => (
        <Dialog
          open={isOpen}
          onClose={() => handleIsOpenChange(false)}
          {...props}
        />
      )}
    </DrawerProvider>
  )
}

export interface DrawerBackdropProps extends Omit<
  React.ComponentPropsWithRef<typeof DialogBackdrop>,
  'transition'
> {}

export function DrawerBackdrop({ ref, ...props }: DrawerBackdropProps) {
  const overlayProps = useDrawerOverlay(
    ref as React.Ref<HTMLDivElement> | undefined,
  )

  return <DialogBackdrop {...props} {...overlayProps} />
}

export interface DrawerPanelProps extends Omit<
  React.ComponentPropsWithRef<typeof DialogPanel>,
  'transition'
> {}

export function DrawerPanel({ style, ref, ...props }: DrawerPanelProps) {
  const contentProps = useDrawerContent({
    ref: ref as React.Ref<HTMLDivElement> | undefined,
    style,
  })

  return <DialogPanel {...props} {...contentProps} />
}

export interface DrawerTitleProps extends React.ComponentPropsWithRef<
  typeof DialogTitle
> {}

export const DrawerTitle = DialogTitle

export interface DrawerCloseProps extends React.ComponentPropsWithRef<
  typeof CloseButton
> {}

export const DrawerClose = CloseButton

export const Drawer = {
  Registry: DrawerRegistryProvider,
  Root: DrawerRoot,
  Backdrop: DrawerBackdrop,
  Panel: DrawerPanel,
  Title: DrawerTitle,
  Close: DrawerClose,
}
