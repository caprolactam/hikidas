import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Drawer,
  NestingDrawerProvider,
} from '../../packages/react/src/adapters/headlessui'

export default {
  title: 'Adapters/Headless UI',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

// Smoke test — verifies the Headless UI adapter renders and basic open/close works
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <div className='min-h-screen bg-slate-50 p-6'>
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'
        >
          Open Drawer
        </button>
        <Drawer.Root open={open} onClose={() => setOpen(false)}>
          <Drawer.Backdrop className='fixed inset-0 bg-black/50' />
          <Drawer.Panel
            data-testid='drawer'
            className='fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200'
          >
            <div
              className='flex justify-center pt-3 pb-2'
              data-testid='drag-handle'
            >
              <div className='h-1 w-12 rounded-full bg-slate-300' />
            </div>
            <div className='space-y-4 px-6 pb-6'>
              <Drawer.Title className='text-lg font-semibold'>
                Headless UI Adapter
              </Drawer.Title>
              <p className='text-sm leading-relaxed text-slate-600'>
                Smoke test for the Headless UI adapter. Open, drag, and close
                should all work correctly.
              </p>
              <Drawer.Close className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                Close
              </Drawer.Close>
            </div>
          </Drawer.Panel>
        </Drawer.Root>
      </div>
    )
  },
}

// Smoke test — verifies snap points work through the Headless UI adapter
export const SnapPoints: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <div className='min-h-screen bg-slate-50 p-6'>
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'
        >
          Open Drawer
        </button>
        <Drawer.Root
          open={open}
          onClose={() => setOpen(false)}
          snapPoints={[0.3, 0.6, 1.0]}
        >
          <Drawer.Backdrop className='fixed inset-0 bg-black/50' />
          <Drawer.Panel
            data-testid='drawer'
            className='fixed bottom-0 inset-x-0 bg-white h-screen rounded-t-3xl border border-slate-200'
          >
            <div
              className='flex justify-center pt-3 pb-2'
              data-testid='drag-handle'
            >
              <div className='h-1 w-12 rounded-full bg-slate-300' />
            </div>
            <div className='space-y-4 px-6 pb-6'>
              <Drawer.Title className='text-lg font-semibold'>
                Snap Points
              </Drawer.Title>
              <p className='text-sm leading-relaxed text-slate-600'>
                Snap points at 30 %, 60 %, and 100 %.
              </p>
              <Drawer.Close className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                Close
              </Drawer.Close>
            </div>
          </Drawer.Panel>
        </Drawer.Root>
      </div>
    )
  },
}

// Smoke test — verifies nested drawers work through the Headless UI adapter
export const Nested: Story = {
  render: () => {
    const [parentOpen, setParentOpen] = useState(false)
    const [childOpen, setChildOpen] = useState(false)

    return (
      <div className='min-h-screen bg-slate-50 p-6'>
        <NestingDrawerProvider>
          <button
            type='button'
            onClick={() => setParentOpen(true)}
            className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'
          >
            Open Parent
          </button>
          <Drawer.Root open={parentOpen} onClose={() => setParentOpen(false)}>
            <Drawer.Backdrop className='fixed inset-0 bg-black/50' />
            <Drawer.Panel
              data-testid='drawer'
              className='fixed bottom-0 inset-x-0 bg-white h-[75vh] rounded-t-3xl border border-slate-200 after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:pointer-events-none after:transition-[background-color] after:duration-200 after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5'
            >
              <div
                className='flex justify-center pt-3 pb-2'
                data-testid='drag-handle'
              >
                <div className='h-1 w-12 rounded-full bg-slate-300' />
              </div>
              <div className='space-y-4 px-6 pb-6'>
                <Drawer.Title className='text-lg font-semibold'>
                  Parent Drawer
                </Drawer.Title>

                <button
                  type='button'
                  onClick={() => setChildOpen(true)}
                  className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'
                >
                  Open Child
                </button>
                <Drawer.Root
                  open={childOpen}
                  onClose={() => setChildOpen(false)}
                >
                  <Drawer.Panel
                    data-testid='drawer'
                    className='fixed bottom-0 inset-x-0 bg-white h-[65vh] rounded-t-3xl border border-slate-200'
                  >
                    <div
                      className='flex justify-center pt-3 pb-2'
                      data-testid='drag-handle'
                    >
                      <div className='h-1 w-12 rounded-full bg-slate-300' />
                    </div>
                    <div className='space-y-4 px-6 pb-6'>
                      <Drawer.Title className='text-lg font-semibold'>
                        Child Drawer
                      </Drawer.Title>
                      <Drawer.Close className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                        Close Child
                      </Drawer.Close>
                    </div>
                  </Drawer.Panel>
                </Drawer.Root>

                <Drawer.Close className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                  Close Parent
                </Drawer.Close>
              </div>
            </Drawer.Panel>
          </Drawer.Root>
        </NestingDrawerProvider>
      </div>
    )
  },
}
