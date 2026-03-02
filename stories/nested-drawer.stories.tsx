import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer } from '../src/adapters/radix-ui'
import {
  triggerClassName,
  Overlay,
  DummyHandle,
  Title,
  Description,
  closeButtonClassName,
} from './drawer'

export default {
  title: 'Nested Drawer',
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

export const Basic: Story = {
  name: 'Basic (2 levels)',
  render: () => (
    <Drawer.Registry>
      <div className='h-screen w-full bg-slate-50 p-6'>
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
                  Open a child drawer to see the parent scale down.
                </Description>

                {/* Child drawer nested inside parent */}
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
                          The parent drawer behind should be scaled down. Close
                          this to see it scale back up.
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
    </Drawer.Registry>
  ),
}

export const ThreeLevels: Story = {
  name: 'Deep Nesting (3 levels)',
  render: () => (
    <Drawer.Registry>
      <div className='h-screen w-full bg-slate-50 p-6'>
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
      </div>
    </Drawer.Registry>
  ),
}

export const Controlled: Story = {
  name: 'Controlled Nested',
  render: () => {
    const [parentOpen, setParentOpen] = useState(false)
    const [childOpen, setChildOpen] = useState(false)

    return (
      <Drawer.Registry>
        <div className='h-screen w-full bg-slate-50 p-6 space-y-4'>
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
                  <Title>Parent Drawer (Controlled)</Title>
                  <Description>
                    Both drawers use controlled state. Open the child to see the
                    nesting animation.
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
                          <Title>Child Drawer (Controlled)</Title>
                          <Description>
                            Close via drag or button to see the parent scale
                            back up.
                          </Description>
                          <button
                            type='button'
                            className={closeButtonClassName}
                            onClick={() => setChildOpen(false)}
                          >
                            Close Child
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
        </div>
      </Drawer.Registry>
    )
  },
}

export const WithoutRegistry: Story = {
  name: 'Without DrawerRegistryProvider',
  render: () => (
    <Drawer.Registry>
      <div className='h-screen w-full bg-slate-50 p-6'>
        <p className='mb-4 text-sm text-slate-500'>
          No DrawerRegistryProvider — nesting animation is disabled. Drawers
          work independently.
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
    </Drawer.Registry>
  ),
}

export const InitiallyOpen: Story = {
  name: 'Both Initially Open (defaultOpen)',
  render: () => (
    <Drawer.Registry>
      <div className='h-screen w-full bg-slate-50 p-6'>
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
      </div>
    </Drawer.Registry>
  ),
}

export const CloseParentFromChild: Story = {
  name: 'Close Parent from Child',
  render: () => {
    const [parentOpen, setParentOpen] = useState(false)
    const [childOpen, setChildOpen] = useState(false)

    return (
      <Drawer.Registry>
        <div className='h-screen w-full bg-slate-50 p-6 space-y-4'>
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
        </div>
      </Drawer.Registry>
    )
  },
}

export const DifferentDirections: Story = {
  name: 'Mixed Directions',
  render: () => (
    <Drawer.Registry>
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Drawer.Root dismissalDirection='down'>
          <Drawer.Trigger className={triggerClassName}>
            Open Bottom Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <Drawer.Content className="fixed bottom-0 inset-x-0 bg-white h-[75vh] rounded-t-3xl border border-slate-200 after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:pointer-events-none after:content-[''] after:transition-[background-color] after:duration-350 after:ease-[cubic-bezier(0.32,0.72,0,1)] aria-hidden:after:bg-black/5">
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Bottom Drawer (Parent)</Title>
                <Description>
                  Parent slides from bottom. Child slides from right.
                </Description>

                <Drawer.Root dismissalDirection='right'>
                  <Drawer.Trigger className={triggerClassName}>
                    Open Right Drawer
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Content className='fixed top-0 right-0 bottom-0 w-[80vw] max-w-md bg-white rounded-l-3xl border border-slate-200'>
                      <DummyHandle />
                      <div className='space-y-4 px-6 pt-8 pb-6'>
                        <Title>Right Drawer (Child)</Title>
                        <Description>
                          The parent should scale down when this opens,
                          regardless of the different dismissal direction.
                        </Description>
                        <Drawer.Close className={closeButtonClassName}>
                          Close Child
                        </Drawer.Close>
                      </div>
                    </Drawer.Content>
                  </Drawer.Portal>
                </Drawer.Root>

                <Drawer.Close className={closeButtonClassName}>
                  Close Parent
                </Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </Drawer.Registry>
  ),
}
