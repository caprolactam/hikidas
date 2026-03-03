import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer } from '../../src/react/adapters/base-ui'

export default {
  title: 'Adapters/Base UI',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

// Smoke test — verifies the Base UI adapter renders and basic open/close works
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <Drawer.Registry>
        <div className='min-h-screen bg-slate-50 p-6'>
          <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'>
              Open Drawer
            </Drawer.Trigger>

            <Drawer.Portal>
              <Drawer.Backdrop className='fixed inset-0 bg-black/50' />
              <Drawer.Viewport className='fixed inset-0 pointer-events-none flex items-end justify-center'>
                <Drawer.Popup className='pointer-events-auto bg-white w-full h-75 rounded-t-3xl border border-slate-200'>
                  <div
                    className='flex justify-center pt-3 pb-2'
                    data-testid='drag-handle'
                  >
                    <div className='h-1 w-12 rounded-full bg-slate-300' />
                  </div>
                  <div className='space-y-4 px-6 pb-6'>
                    <Drawer.Title className='text-lg font-semibold'>
                      Base UI Adapter
                    </Drawer.Title>
                    <Drawer.Description className='text-sm leading-relaxed text-slate-600'>
                      Smoke test for the Base UI adapter. Open, drag, and close
                      should all work correctly.
                    </Drawer.Description>
                    <Drawer.Close className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                      Close
                    </Drawer.Close>
                  </div>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </Drawer.Registry>
    )
  },
}
