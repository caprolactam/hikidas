# @hikidas/vue

Headless drawer behavior for Vue, with an adapter for [Reka UI](https://reka-ui.com/).

Hikidas adds drag-to-dismiss, directional dismissal, and snap point behavior on top of existing dialog primitives.

## Installation

```bash
npm install @hikidas/vue reka-ui
```

## Quick Start

```vue
<script setup>
import { Drawer } from '@hikidas/vue/reka-ui'
</script>

<template>
  <Drawer.Root>
    <Drawer.Trigger>Open</Drawer.Trigger>

    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 bg-black/40" />
      <Drawer.Content
        class="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white"
      >
        <Drawer.Title>Drawer title</Drawer.Title>
        <Drawer.Description>Drawer description</Drawer.Description>
        <Drawer.Close>Close</Drawer.Close>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
</template>
```

## `Drawer.Root` Props

| Prop                 | Type                                  | Default                 | Description                                                                      |
| -------------------- | ------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `defaultOpen`        | `boolean`                             | `false`                 | Initial open state in uncontrolled mode.                                         |
| `open`               | `boolean`                             | -                       | Controlled open state. Use `v-model:open` for two-way binding.                   |
| `dismissalDirection` | `'up' \| 'down' \| 'left' \| 'right'` | `'down'`                | Swipe direction used to dismiss and animate the drawer.                          |
| `disableDragDismiss` | `boolean`                             | `false`                 | Disables closing by drag gestures.                                               |
| `snapPoints`         | `number[]`                            | `undefined`             | Snap positions as ratios in `(0, 1]`, ascending (for example: `[0.25, 0.5, 1]`). |
| `defaultSnapPoint`   | `number`                              | `snapPoints.length - 1` | Initial active snap point index (uncontrolled).                                  |
| `snapPoint`          | `number`                              | -                       | Controlled active snap point index. Use `v-model:snapPoint` for two-way binding. |

### Events

| Event              | Payload   | Description                                 |
| ------------------ | --------- | ------------------------------------------- |
| `update:open`      | `boolean` | Emitted when the open state changes.        |
| `update:snapPoint` | `number`  | Emitted when the active snap point changes. |

## Components

- `Drawer.Root`
- `Drawer.Trigger` — re-exports `DialogTrigger` from Reka UI
- `Drawer.Portal`
- `Drawer.Overlay`
- `Drawer.Content`
- `Drawer.Close` — re-exports `DialogClose` from Reka UI
- `Drawer.Title` — re-exports `DialogTitle` from Reka UI
- `Drawer.Description` — re-exports `DialogDescription` from Reka UI

## Notes

- To exclude an element (or subtree) from starting drag gestures, add `data-drawer-no-drag`.
- `disableDragDismiss` only affects drag gestures. Use Reka UI's event handlers on `Drawer.Content` for Escape key (`@escape-key-down.prevent`) and outside-click (`@pointer-down-outside.prevent`) behavior.
- In snap-point mode, changes to controlled `snapPoint` are applied only when the drawer is in a stable state (closed or idle).

## License

MIT
