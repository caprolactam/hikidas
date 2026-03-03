import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer } from '../../src/react/adapters/radix-ui'

export default {
  title: 'Adapters/Radix UI',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

// Smoke test — verifies the Radix UI adapter renders and basic open/close works
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <Drawer.Registry>
        <div className='min-h-screen bg-slate-50 p-6'>
          <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
              <button className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'>
                Open Drawer
              </button>
            </Drawer.Trigger>

            <Drawer.Portal>
              <Drawer.Overlay className='fixed inset-0 bg-black/50' />
              <Drawer.Content className='fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200'>
                <div
                  className='flex justify-center pt-3 pb-2'
                  data-testid='drag-handle'
                >
                  <div className='h-1 w-12 rounded-full bg-slate-300' />
                </div>
                <div className='space-y-4 px-6 pb-6'>
                  <Drawer.Title className='text-lg font-semibold'>
                    Radix UI Adapter
                  </Drawer.Title>
                  <Drawer.Description className='text-sm leading-relaxed text-slate-600'>
                    Smoke test for the Radix UI adapter. Open, drag, and close
                    should all work correctly.
                  </Drawer.Description>
                  <Drawer.Close asChild>
                    <button className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                      Close
                    </button>
                  </Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </Drawer.Registry>
    )
  },
}
