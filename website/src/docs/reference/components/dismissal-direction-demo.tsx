import { Drawer } from '@hikidas/react/radix-ui'
import { useState } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'

const containerStyles: Record<Direction, string> = {
  down: 'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[min(calc(100dvh-2rem),22rem)] rounded-t-2xl',
  up: 'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[min(calc(100dvh-2rem),22rem)] rounded-b-2xl',
  left: 'fixed top-1/2 left-0 -translate-y-1/2 h-[min(100dvh,32rem)] w-[min(calc(100vw-2rem),24rem)] rounded-r-2xl',
  right:
    'fixed top-1/2 right-0 -translate-y-1/2 h-[min(100dvh,32rem)] w-[min(calc(100vw-2rem),24rem)] rounded-l-2xl',
}

const containerAfterStyles: Record<Direction, string> = {
  down: 'after:absolute after:bg-inherit after:top-full after:left-0 after:right-0 after:h-[200%]',
  up: 'after:absolute after:bg-inherit after:bottom-full after:left-0 after:right-0 after:h-[200%]',
  left: 'after:absolute after:bg-inherit after:right-full after:top-0 after:bottom-0 after:w-[200%]',
  right:
    'after:absolute after:bg-inherit after:left-full after:top-0 after:bottom-0 after:w-[200%]',
}

export function DismissalDirectionDemo() {
  const [direction, setDirection] = useState<Direction>('down')

  return (
    <div className='flex flex-col gap-4'>
      <div className='p-5 bg-gradient-to-b from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200'>
        <div className='flex flex-col gap-3'>
          <label className='text-sm font-semibold text-neutral-800'>
            Dismissal Direction:
          </label>
          <div className='flex gap-2 flex-wrap'>
            {(['down', 'up', 'left', 'right'] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                className={`
                  px-4 py-2 rounded-md border text-sm font-medium capitalize
                  transition-all duration-150
                  ${
                    direction === dir
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400'
                  }
                `}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
        <p className='mt-2.5 text-[0.8125rem] leading-relaxed text-neutral-500'>
          Select a direction and open the drawer. Try dragging it to see which
          direction dismisses it.
        </p>
      </div>

      <div className='p-8 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-center items-center min-h-[8rem]'>
        <Drawer.Root dismissalDirection={direction}>
          <Drawer.Trigger className='inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100 min-w-[10rem]'>
            Open Drawer ({direction})
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className='fixed inset-0 z-40 bg-black/60' />
            <Drawer.Content
              className={`
                ${containerStyles[direction]}
                ${containerAfterStyles[direction]}
                z-50 bg-white p-6
              `}
            >
              <Drawer.Close className='absolute top-4 right-4 h-8 px-3.5 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-900 transition-all hover:bg-neutral-50'>
                Close
              </Drawer.Close>
              <Drawer.Title className='pr-16 text-lg font-semibold leading-7 tracking-tight text-neutral-900 mb-4'>
                Dismissal Direction: {direction}
              </Drawer.Title>
              <div className='mt-4'>
                <p className='mb-3.5 leading-relaxed text-neutral-700 text-[0.9375rem]'>
                  Drag{' '}
                  {direction === 'down'
                    ? 'down'
                    : direction === 'up'
                      ? 'up'
                      : direction === 'left'
                        ? 'left'
                        : 'right'}{' '}
                  to dismiss this drawer.
                </p>
                <p className='text-sm text-neutral-500 leading-relaxed'>
                  The drawer slides in from the{' '}
                  {direction === 'down'
                    ? 'bottom'
                    : direction === 'up'
                      ? 'top'
                      : direction === 'left'
                        ? 'left'
                        : 'right'}{' '}
                  and can be dismissed by dragging {direction}.
                </p>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  )
}
