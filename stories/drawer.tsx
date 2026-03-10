import { Drawer } from '../src/react/adapters/radix-ui'

export const Root = Drawer.Root

export const triggerClassName =
  'inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'

export function Trigger({
  children = 'Open Drawer',
}: {
  children?: React.ReactNode
}) {
  return (
    <Drawer.Trigger className={triggerClassName}>{children}</Drawer.Trigger>
  )
}

export const Portal = Drawer.Portal

export function Overlay() {
  return (
    <Drawer.Overlay
      className='fixed inset-0 bg-black/50'
      data-testid='overlay'
    />
  )
}

export function Content({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Content className='fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200'>
      {children}
    </Drawer.Content>
  )
}

export function DummyHandle() {
  return (
    <div className='flex justify-center pt-3 pb-2' data-testid='drag-handle'>
      <div className='h-1 w-12 rounded-full bg-slate-300' />
    </div>
  )
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Title className='text-lg font-semibold'>{children}</Drawer.Title>
  )
}

export function Description({ children }: { children: React.ReactNode }) {
  return (
    <Drawer.Description className='text-sm leading-relaxed text-slate-600'>
      {children}
    </Drawer.Description>
  )
}

export const closeButtonClassName =
  'inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'

export function Close({ children = 'Close' }: { children?: React.ReactNode }) {
  return (
    <Drawer.Close className={closeButtonClassName}>{children}</Drawer.Close>
  )
}
