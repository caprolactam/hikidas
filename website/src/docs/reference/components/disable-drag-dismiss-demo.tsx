import { Drawer } from '@hikidas/react/radix-ui'
import { useState } from 'react'

export function DisableDragDismissDemo() {
  const [disableDrag, setDisableDrag] = useState(false)

  return (
    <div className='flex flex-col gap-4'>
      <div className='p-5 bg-gradient-to-b from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200'>
        <label className='flex items-center gap-2.5 cursor-pointer text-sm font-medium text-neutral-800'>
          <input
            type='checkbox'
            checked={disableDrag}
            onChange={(e) => setDisableDrag(e.target.checked)}
            className='w-[1.125rem] h-[1.125rem] cursor-pointer accent-neutral-900'
          />
          <span>Disable drag to dismiss</span>
        </label>
        <p className='mt-2.5 text-[0.8125rem] leading-relaxed text-neutral-500'>
          When enabled, the drawer cannot be dismissed by dragging. You must use
          the close button.
        </p>
      </div>

      <div className='p-8 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-center items-center min-h-[8rem]'>
        <Drawer.Root disableDragDismiss={disableDrag}>
          <Drawer.Trigger className='inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100 min-w-[10rem]'>
            Open Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className='fixed inset-0 z-40 bg-black/60' />
            <Drawer.Content className='fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl h-[min(calc(100dvh-2rem),22rem)] rounded-t-2xl bg-white p-6 shadow-2xl after:absolute after:bg-inherit after:top-full after:left-0 after:right-0 after:h-[200%]'>
              <Drawer.Close className='absolute top-4 right-4 h-8 px-3.5 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-900 transition-all hover:bg-neutral-50'>
                Close
              </Drawer.Close>
              <Drawer.Title className='pr-16 text-lg font-semibold leading-7 tracking-tight text-neutral-900 mb-4'>
                Drag Dismiss: {disableDrag ? 'Disabled' : 'Enabled'}
              </Drawer.Title>
              <div className='mt-4'>
                <p className='mb-3.5 leading-relaxed text-neutral-700 text-[0.9375rem]'>
                  {disableDrag ? (
                    <>
                      <strong className='font-semibold'>
                        Dragging is disabled.
                      </strong>{' '}
                      Try dragging - it won't work. You must click the close
                      button to dismiss.
                    </>
                  ) : (
                    <>
                      <strong className='font-semibold'>
                        Dragging is enabled.
                      </strong>{' '}
                      Try dragging down to dismiss the drawer, or use the close
                      button.
                    </>
                  )}
                </p>
                <p className='text-sm text-neutral-500 leading-relaxed'>
                  This is useful for critical interactions where you want to
                  force explicit confirmation.
                </p>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  )
}
