# @hikidas/react

Headless drawer behavior for React, with adapters for [Radix UI](https://www.radix-ui.com/), [Base UI](https://base-ui.com/), and [Headless UI](https://headlessui.com/).

Hikidas adds drag-to-dismiss, directional dismissal, and snap point behavior on top of existing dialog primitives.

## Installation

Install Hikidas and the adapter's peer dependency:

```bash
# Radix UI adapter
npm install @hikidas/react radix-ui

# Base UI adapter
npm install @hikidas/react @base-ui/react

# Headless UI adapter
npm install @hikidas/react @headlessui/react
```

## Quick Start (Radix UI)

```tsx
import { Drawer } from '@hikidas/react/radix-ui'

export function Example() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Open</Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40' />
        <Drawer.Content className='fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white'>
          <Drawer.Title>Drawer title</Drawer.Title>
          <Drawer.Description>Drawer description</Drawer.Description>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

## Quick Start (Base UI)

```tsx
import { Drawer } from '@hikidas/react/base-ui'

export function Example() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Open</Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Backdrop className='fixed inset-0 bg-black/40' />
        <Drawer.Viewport className='fixed inset-0 pointer-events-none flex items-end'>
          <Drawer.Popup className='pointer-events-auto w-full rounded-t-2xl bg-white'>
            <Drawer.Title>Drawer title</Drawer.Title>
            <Drawer.Description>Drawer description</Drawer.Description>
            <Drawer.Close>Close</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

## Quick Start (Headless UI)

```tsx
import { useState } from 'react'
import { Drawer } from '@hikidas/react/headlessui'

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>

      <Drawer.Root open={open} onClose={() => setOpen(false)}>
        <Drawer.Backdrop className='fixed inset-0 bg-black/40' />
        <Drawer.Panel className='fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white'>
          <Drawer.Title>Drawer title</Drawer.Title>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Panel>
      </Drawer.Root>
    </>
  )
}
```

## `Drawer.Root` Props

### Radix UI / Base UI

| Prop                 | Type                                  | Default                 | Description                                                                      |
| -------------------- | ------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `defaultOpen`        | `boolean`                             | `false`                 | Initial open state in uncontrolled mode.                                         |
| `open`               | `boolean`                             | -                       | Controlled open state.                                                           |
| `onOpenChange`       | `(open: boolean) => void`             | -                       | Called when open state changes.                                                  |
| `dismissalDirection` | `'up' \| 'down' \| 'left' \| 'right'` | `'down'`                | Swipe direction used to dismiss and animate the drawer.                          |
| `disableDragDismiss` | `boolean`                             | `false`                 | Disables closing by drag gestures.                                               |
| `snapPoints`         | `number[]`                            | `undefined`             | Snap positions as ratios in `(0, 1]`, ascending (for example: `[0.25, 0.5, 1]`). |
| `defaultSnapPoint`   | `number`                              | `snapPoints.length - 1` | Initial active snap point index (uncontrolled).                                  |
| `snapPoint`          | `number`                              | -                       | Controlled active snap point index.                                              |
| `onSnapPointChange`  | `(index: number) => void`             | -                       | Called when active snap point index changes.                                     |

### Headless UI

The Headless UI adapter follows the Headless UI Dialog convention: always controlled with `open` + `onClose`.

| Prop                 | Type                                  | Default                 | Description                                                                      |
| -------------------- | ------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `open`               | `boolean`                             | (required)              | Whether the drawer is open.                                                      |
| `onClose`            | `(value: false) => void`              | (required)              | Called when the drawer should close.                                             |
| `dismissalDirection` | `'up' \| 'down' \| 'left' \| 'right'` | `'down'`                | Swipe direction used to dismiss and animate the drawer.                          |
| `disableDragDismiss` | `boolean`                             | `false`                 | Disables closing by drag gestures.                                               |
| `snapPoints`         | `number[]`                            | `undefined`             | Snap positions as ratios in `(0, 1]`, ascending (for example: `[0.25, 0.5, 1]`). |
| `defaultSnapPoint`   | `number`                              | `snapPoints.length - 1` | Initial active snap point index.                                                 |
| `snapPoint`          | `number`                              | -                       | Controlled active snap point index.                                              |
| `onSnapPointChange`  | `(index: number) => void`             | -                       | Called when active snap point index changes.                                     |

## Adapter Components

### `@hikidas/react/radix-ui`

- `Drawer.Root`
- `Drawer.Trigger`
- `Drawer.Portal`
- `Drawer.Overlay`
- `Drawer.Content`
- `Drawer.Close`
- `Drawer.Title`
- `Drawer.Description`

### `@hikidas/react/base-ui`

- `Drawer.Root`
- `Drawer.Trigger`
- `Drawer.Portal`
- `Drawer.Backdrop`
- `Drawer.Viewport`
- `Drawer.Popup`
- `Drawer.Close`
- `Drawer.Title`
- `Drawer.Description`

### `@hikidas/react/headlessui`

- `Drawer.Root` — wraps `Dialog` (always controlled, auto-portaled)
- `Drawer.Backdrop` — wraps `DialogBackdrop`
- `Drawer.Panel` — wraps `DialogPanel`
- `Drawer.Title` — wraps `DialogTitle`
- `Drawer.Close` — wraps `CloseButton`

> Headless UI does not provide `Trigger` or `Portal` components. The dialog is automatically rendered in a portal; use a regular `<button>` to toggle the `open` state.

## Notes

- To exclude an element (or subtree) from starting drag gestures, add `data-drawer-no-drag`.
- `disableDragDismiss` only affects drag gestures. Use your underlying UI library events/props for Escape key and outside-click behavior.
- In snap-point mode, changes to controlled `snapPoint` are applied only when the drawer is in a stable state (closed or idle).

## License

MIT
