import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  NestingDrawerProvider,
  Drawer,
  triggerClassName,
  Overlay,
  DummyHandle,
  Title,
  Description,
  closeButtonClassName,
} from './drawer'

export default {
  title: 'Drawer/Nested',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

// ── Shared Components ────────────────────────────────────────

function NestedContent({
  children,
  level = 0,
}: {
  children: React.ReactNode
  level?: number
}) {
  const heights = ['h-[75vh]', 'h-[65vh]', 'h-[55vh]']
  return (
    <Drawer.Content
      className={`fixed bottom-0 inset-x-0 bg-white ${heights[level] ?? 'h-[50vh]'} rounded-t-3xl border border-slate-200 after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:pointer-events-none after:transition-[background-color] after:duration-200 after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5`}
    >
      {children}
    </Drawer.Content>
  )
}

// ── Stories ───────────────────────────────────────────────────

export const ThreeLevels: Story = {
  name: 'Deep Nesting (3 levels)',
  render: () => (
    <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root>
          <Drawer.Trigger className={triggerClassName}>
            Open Level 1
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Level 1</Title>
                <Description>
                  Deepest nesting: this will scale down twice (scale = 0.90)
                  when all children are open.
                </Description>

                <Drawer.Root>
                  <Drawer.Trigger className={triggerClassName}>
                    Open Level 2
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <NestedContent level={1}>
                      <DummyHandle />
                      <div className='space-y-4 px-6 pb-6'>
                        <Title>Level 2</Title>
                        <Description>
                          This will scale down once (scale = 0.95) when the
                          grandchild opens.
                        </Description>

                        <Drawer.Root>
                          <Drawer.Trigger className={triggerClassName}>
                            Open Level 3
                          </Drawer.Trigger>
                          <Drawer.Portal>
                            <NestedContent level={2}>
                              <DummyHandle />
                              <div className='space-y-4 px-6 pb-6'>
                                <Title>Level 3</Title>
                                <Description>
                                  The deepest drawer. Close this to see the
                                  parents scale back up one by one.
                                </Description>
                                <Drawer.Close className={closeButtonClassName}>
                                  Close Level 3
                                </Drawer.Close>
                              </div>
                            </NestedContent>
                          </Drawer.Portal>
                        </Drawer.Root>

                        <Drawer.Close className={closeButtonClassName}>
                          Close Level 2
                        </Drawer.Close>
                      </div>
                    </NestedContent>
                  </Drawer.Portal>
                </Drawer.Root>

                <Drawer.Close className={closeButtonClassName}>
                  Close Level 1
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
  ),
}

export const WithoutProvider: Story = {
  name: 'Without NestingDrawerProvider',
  render: () => (
    <div className='h-screen w-full bg-slate-50 p-6'>
      <p className='mb-4 text-sm text-slate-500'>
        No NestingDrawerProvider — nesting animation is disabled. Drawers work
        independently.
      </p>
      <Drawer.Root>
        <Drawer.Trigger className={triggerClassName}>
          Open Parent Drawer
        </Drawer.Trigger>
        <Drawer.Portal>
          <Overlay />
          <NestedContent level={0}>
            <DummyHandle />
            <div className='space-y-4 px-6 pb-6'>
              <Title>Parent Drawer</Title>
              <Description>
                No scale animation will occur when the child opens.
              </Description>

              <Drawer.Root>
                <Drawer.Trigger className={triggerClassName}>
                  Open Child Drawer
                </Drawer.Trigger>
                <Drawer.Portal>
                  <NestedContent level={1}>
                    <DummyHandle />
                    <div className='space-y-4 px-6 pb-6'>
                      <Title>Child Drawer</Title>
                      <Description>
                        Parent should NOT scale — no registry is present.
                      </Description>
                      <Drawer.Close className={closeButtonClassName}>
                        Close Child
                      </Drawer.Close>
                    </div>
                  </NestedContent>
                </Drawer.Portal>
              </Drawer.Root>

              <Drawer.Close className={closeButtonClassName}>
                Close Parent
              </Drawer.Close>
            </div>
          </NestedContent>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  ),
}

export const InitiallyOpen: Story = {
  name: 'Both Initially Open (defaultOpen)',
  render: () => (
    <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root defaultOpen>
          <Drawer.Trigger className={triggerClassName}>
            Open Parent Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Parent Drawer</Title>
                <Description>
                  Both parent and child are initially open. The parent should
                  already be scaled down on mount — no flash.
                  <br />
                  <br />
                  <strong>Note:</strong> After closing all drawers and reopening
                  the parent, the child remounts with defaultOpen=true again.
                  Use controlled `open` prop to preserve closed state across
                  parent reopen cycles.
                </Description>

                <Drawer.Root defaultOpen>
                  <Drawer.Trigger className={triggerClassName}>
                    Open Child Drawer
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <NestedContent level={1}>
                      <DummyHandle />
                      <div className='space-y-4 px-6 pb-6'>
                        <Title>Child Drawer</Title>
                        <Description>
                          Close this to see the parent animate back to full
                          scale.
                        </Description>
                        <Drawer.Close className={closeButtonClassName}>
                          Close Child
                        </Drawer.Close>
                      </div>
                    </NestedContent>
                  </Drawer.Portal>
                </Drawer.Root>

                <Drawer.Close className={closeButtonClassName}>
                  Close Parent
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
  ),
}

export const CloseParentFromChild: Story = {
  name: 'Close Parent from Child',
  render: () => {
    const [parentOpen, setParentOpen] = useState(false)
    const [childOpen, setChildOpen] = useState(false)

    return (
      <div className='h-screen w-full bg-slate-50 p-6 space-y-4'>
        <NestingDrawerProvider>
          <div className='flex gap-4 items-center'>
            <button
              type='button'
              className={triggerClassName}
              onClick={() => setParentOpen(true)}
            >
              Open Parent
            </button>
            <p className='text-sm text-slate-600'>
              Parent: <strong>{parentOpen ? 'Open' : 'Closed'}</strong> | Child:{' '}
              <strong>{childOpen ? 'Open' : 'Closed'}</strong>
            </p>
          </div>

          <Drawer.Root open={parentOpen} onOpenChange={setParentOpen}>
            <Drawer.Portal>
              <Overlay />
              <NestedContent level={0}>
                <DummyHandle />
                <div className='space-y-4 px-6 pb-6'>
                  <Title>Parent Drawer</Title>
                  <Description>
                    Open the child drawer, then close the parent from within the
                    child. Both drawers should animate their close transitions.
                  </Description>

                  <Drawer.Root open={childOpen} onOpenChange={setChildOpen}>
                    <button
                      type='button'
                      className={triggerClassName}
                      onClick={() => setChildOpen(true)}
                    >
                      Open Child
                    </button>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child Drawer (Form)</Title>
                          <Description>
                            Simulates a form completion flow. Clicking "Complete
                            & Close Parent" closes the parent drawer, which
                            propagates close to this child drawer as well.
                          </Description>
                          <button
                            type='button'
                            className={closeButtonClassName}
                            onClick={() => setChildOpen(false)}
                          >
                            Close Child Only
                          </button>
                          <button
                            type='button'
                            className={`${closeButtonClassName} bg-blue-600! text-white! hover:bg-blue-700!`}
                            onClick={() => setParentOpen(false)}
                          >
                            Complete & Close Parent
                          </button>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>

                  <button
                    type='button'
                    className={closeButtonClassName}
                    onClick={() => setParentOpen(false)}
                  >
                    Close Parent
                  </button>
                </div>
              </NestedContent>
            </Drawer.Portal>
          </Drawer.Root>
        </NestingDrawerProvider>
      </div>
    )
  },
}

export const Siblings: Story = {
  name: 'Sibling Drawers',
  render: () => (
    <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root>
          <Drawer.Trigger className={triggerClassName}>
            Open Parent Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Parent Drawer</Title>
                <Description>
                  Two sibling child drawers share the same parent. Close one and
                  open the other — the parent scale animation should transition
                  correctly between siblings.
                </Description>

                <div className='flex gap-3'>
                  <Drawer.Root>
                    <Drawer.Trigger className={triggerClassName}>
                      Open Child A
                    </Drawer.Trigger>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child A</Title>
                          <Description>
                            Close this drawer, then open Child B from the
                            parent.
                          </Description>
                          <Drawer.Close className={closeButtonClassName}>
                            Close Child A
                          </Drawer.Close>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>

                  <Drawer.Root>
                    <Drawer.Trigger className={triggerClassName}>
                      Open Child B
                    </Drawer.Trigger>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child B</Title>
                          <Description>
                            Close this drawer, then open Child A from the
                            parent.
                          </Description>
                          <Drawer.Close className={closeButtonClassName}>
                            Close Child B
                          </Drawer.Close>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>
                </div>

                <Drawer.Close className={closeButtonClassName}>
                  Close Parent
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
  ),
}
