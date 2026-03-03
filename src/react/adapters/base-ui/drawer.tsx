import {
  Dialog,
  type DialogRootProps,
  type DialogTriggerProps,
  type DialogPortalProps,
  type DialogBackdropProps,
  type DialogViewportProps,
  type DialogPopupProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
  type DialogCloseProps,
} from '@base-ui/react/dialog'
import { DrawerRegistryProvider, DrawerProvider } from '../../provider'
import {
  useDrawerContent,
  useDrawerOverlay,
  type DrawerRootAPI,
} from '../../use-drawer'

export { DrawerRegistryProvider }

export interface DrawerRootProps<Payload = unknown>
  extends
    DrawerRootAPI,
    Omit<DialogRootProps<Payload>, 'defaultOpen' | 'open' | 'onOpenChange'> {}

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

export interface DrawerBackdropProps extends DialogBackdropProps {}

export function DrawerBackdrop({ ref, ...props }: DrawerBackdropProps) {
  const overlayProps = useDrawerOverlay(ref)

  return <Dialog.Backdrop {...props} {...overlayProps} />
}

interface DrawerPopupProps extends DialogPopupProps {}

export function DrawerPopup({ style, ref, ...props }: DrawerPopupProps) {
  const contentProps = useDrawerContent({
    ref,
    style,
  })

  return <Dialog.Popup {...props} {...contentProps} />
}

export interface DrawerTriggerProps extends DialogTriggerProps {}
export const DrawerTrigger = Dialog.Trigger

export interface DrawerPortalProps extends Omit<
  DialogPortalProps,
  'keepMounted'
> {}
export function DrawerPortal(props: DrawerPortalProps) {
  return <Dialog.Portal {...props} />
}

export interface DrawerViewportProps extends DialogViewportProps {}
export const DrawerViewport = Dialog.Viewport

export interface DrawerTitleProps extends DialogTitleProps {}
export const DrawerTitle = Dialog.Title

export interface DrawerDescriptionProps extends DialogDescriptionProps {}
export const DrawerDescription = Dialog.Description

export interface DrawerCloseProps extends DialogCloseProps {}
export const DrawerClose = Dialog.Close

export const Drawer = {
  Registry: DrawerRegistryProvider,
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Portal: DrawerPortal,
  Backdrop: DrawerBackdrop,
  Viewport: DrawerViewport,
  Popup: DrawerPopup,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
}
