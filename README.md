# Hikidas

Headless drawer behavior for React and Vue, with adapters for popular UI libraries.

Hikidas adds drag-to-dismiss, directional dismissal, and snap point behavior on top of existing dialog primitives.

## Packages

| Package                            | Description                                           |
| ---------------------------------- | ----------------------------------------------------- |
| [@hikidas/react](./packages/react) | React adapters for Radix UI, Base UI, and Headless UI |
| [@hikidas/vue](./packages/vue)     | Vue adapter for Reka UI                               |
| [@hikidas/core](./packages/core)   | Shared animation and state machine engine (internal)  |

## Why Hikidas

- **Works with your existing UI library** — Already using Radix UI, Base UI, Headless UI, or Reka UI? Hikidas layers drawer behavior on top without replacing your primitives. Accessibility, focus management, and portal handling stay exactly where they are.
- **Spring physics, zero animation deps** — Hikidas ships its own spring engine powered by the Web Animations API. Gesture velocity is handed off directly to the spring at release, so flicks feel snappy and slow releases feel gentle.
- **React and Vue** — Same core engine, framework-native adapters. Use whichever framework your project needs.

## Installation

### React

```bash
# Radix UI adapter
npm install @hikidas/react radix-ui

# Base UI adapter
npm install @hikidas/react @base-ui/react

# Headless UI adapter
npm install @hikidas/react @headlessui/react
```

### Vue

```bash
npm install @hikidas/vue reka-ui
```

## Quick Start (React — Radix UI)

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

## Quick Start (Vue — Reka UI)

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

> See each package's README for full API documentation and additional adapter examples.

## Development

Requirements:

- Node.js `>=24`
- `pnpm` (workspace is configured with `pnpm@10`)

Commands:

```bash
pnpm install
pnpm build
pnpm test
pnpm e2e
pnpm storybook
```

## License

MIT
