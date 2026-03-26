import { Drawer } from '@hikidas/react/radix-ui'

export function BasicDrawer() {
  return (
    <div className='p-4'>
      <Drawer.Root>
        <Drawer.Trigger className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
          Open Drawer
        </Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Overlay className='fixed inset-0 z-50 bg-black/40' />
          <Drawer.Content className='fixed bottom-0 z-51 left-0 right-0 flex max-h-[96%] flex-col rounded-t-[10px] bg-white'>
            <div className='flex-1 overflow-auto p-4'>
              {/* Visual drag handle */}
              <div className='mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-gray-300' />

              <Drawer.Title className='mb-2 text-2xl font-bold'>
                Drawer Title
              </Drawer.Title>

              <Drawer.Description className='mb-4 text-gray-600'>
                This is a basic drawer example. You can drag it down to close or
                click the close button.
              </Drawer.Description>

              <div className='space-y-4'>
                <p>
                  This drawer provides a simple way to show additional content
                  without navigating away from the current page.
                </p>
                <p>
                  Drag the handle or swipe down anywhere on the drawer to
                  dismiss it.
                </p>
              </div>

              <Drawer.Close asChild>
                <button className='mt-6 w-full rounded-lg bg-gray-100 px-4 py-3 font-medium hover:bg-gray-200'>
                  Close
                </button>
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
