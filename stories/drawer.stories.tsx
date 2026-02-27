import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer } from '../src/adapters/radix-ui'
import {
  Root,
  Trigger,
  triggerClassName,
  Portal,
  Overlay,
  Content,
  DummyHandle,
  Title,
  Description,
  Close,
  closeButtonClassName,
} from './drawer'

export default {
  title: 'Drawer',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

export const Default: Story = {
  render: () => {
    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const InitiallyOpenWithUncontrolled: Story = {
  render: () => {
    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root defaultOpen>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root open={open} onOpenChange={setOpen}>
          <button
            type='button'
            className={triggerClassName}
            onClick={() => setOpen(true)}
          >
            Open Drawer
          </button>
          <p className='text-sm text-slate-600' data-testid='state'>
            State: <strong>{open ? 'Open' : 'Closed'}</strong>
          </p>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <button
                  type='button'
                  className={closeButtonClassName}
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const InitiallyOpenWithControlled: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root open={open} onOpenChange={setOpen}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

function DirectionStory({
  direction,
}: {
  direction: 'down' | 'up' | 'left' | 'right'
}) {
  const isVertical = direction === 'down' || direction === 'up'

  const contentClassName = isVertical
    ? direction === 'down'
      ? 'fixed bottom-0 inset-x-0 bg-white h-[40vh] rounded-t-3xl border border-slate-200'
      : 'fixed top-0 inset-x-0 bg-white h-[40vh] rounded-b-3xl border border-slate-200'
    : direction === 'left'
      ? 'fixed left-0 inset-y-0 bg-white w-[300px] rounded-r-3xl border border-slate-200'
      : 'fixed right-0 inset-y-0 bg-white w-[300px] rounded-l-3xl border border-slate-200'

  const handle = (
    <div className='flex justify-center pt-3 pb-2' data-testid='drag-handle'>
      <div className='h-1 w-12 rounded-full bg-slate-300' />
    </div>
  )

  return (
    <Root dismissalDirection={direction}>
      <Trigger>Open Drawer</Trigger>
      <Portal>
        <Overlay />
        <Drawer.Content className={contentClassName}>
          {handle}
          <div className='px-6 py-4'>
            <Title>
              {direction.charAt(0).toUpperCase() + direction.slice(1)} Drawer
            </Title>
            <Description>Swipe {direction} to close.</Description>
            <Close>Close</Close>
          </div>
        </Drawer.Content>
      </Portal>
    </Root>
  )
}

export const DirectionDown: Story = {
  render: () => (
    <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='down' />
    </div>
  ),
}

export const DirectionUp: Story = {
  render: () => (
    <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='up' />
    </div>
  ),
}

export const DirectionLeft: Story = {
  render: () => (
    <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='left' />
    </div>
  ),
}

export const DirectionRight: Story = {
  render: () => (
    <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='right' />
    </div>
  ),
}

export const DisableDragDismiss: Story = {
  render: () => {
    return (
      <div className='h-screen bg-slate-50 p-6'>
        <Root disableDragDismiss>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Persistent Drawer</Title>
                <Description>
                  Swiping shows a rubber-band effect but will not close the
                  drawer. Use the close button, ESC, or click outside to
                  dismiss.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const SnapPoints: Story = {
  render: () => {
    const snapPoints = [0.2, 0.5, 1.0]

    return (
      <div className='h-screen bg-slate-50 p-6'>
        <Root snapPoints={snapPoints}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Three Snap Points</Title>
                <Description>
                  Snap points at 25 %, 50 %, and 100 %. Drag slowly to snap to
                  the nearest point, or flick quickly to jump further.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const SnapPointsWithDefaultIndex: Story = {
  render: () => {
    return (
      <div className='min-h-screen bg-slate-50 p-6'>
        <Root snapPoints={[0.25, 0.5, 1.0]} defaultSnapPoint={1}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Default Snap Point at 50 %</Title>
                <Description>
                  Opens to the middle snap point (50 %) instead of the highest.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const ControlledSnapPoints: Story = {
  render: () => {
    const [activeSnap, setActiveSnap] = useState(2)
    const snapPoints = [0.5, 0.75, 1.0]

    return (
      <div className='min-h-screen bg-slate-50 p-6'>
        <Root
          snapPoints={snapPoints}
          snapPoint={activeSnap}
          onSnapPointChange={setActiveSnap}
        >
          <div className='space-y-4'>
            <p className='text-sm text-slate-600'>
              Active Snap Index: {activeSnap}
            </p>
            <p className='text-sm text-slate-600'>
              Active Snap Ratio: {snapPoints[activeSnap]! * 100}%
            </p>
            <Trigger>Open Drawer</Trigger>
          </div>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Controlled Snap Points</Title>
                <Description>
                  Use buttons below to change snap point programmatically, or
                  drag to change.
                </Description>
                <div className='flex gap-2'>
                  {snapPoints.map((sp, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSnap(i)}
                      className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        activeSnap === i
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sp * 100}%
                    </button>
                  ))}
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const SingleSnapPoint: Story = {
  render: () => {
    return (
      <div className='h-screen bg-slate-50 p-6'>
        <Root snapPoints={[0.6]}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Single Snap Point (60 %)</Title>
                <Description>
                  Toggles between closed and 60 % height.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const SnapPointsWithDisableDragDismiss: Story = {
  render: () => {
    const [activeSnap, setActiveSnap] = useState(1)
    const snapPoints = [0.5, 1.0]

    return (
      <div className='h-screen bg-slate-50 p-6'>
        <Root
          disableDragDismiss
          snapPoints={snapPoints}
          snapPoint={activeSnap}
          onSnapPointChange={setActiveSnap}
        >
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Snap Points + Dismiss Disabled</Title>
                <Description>
                  Snap points at 30 %, 60 %, 100 %. Dragging below 30 % shows
                  rubber-band but won't close. Use Close button, ESC, or
                  overlay.
                </Description>
                <div className='flex gap-2'>
                  {snapPoints.map((sp, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSnap(i)}
                      className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        activeSnap === i
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sp * 100}%
                    </button>
                  ))}
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const ScrollableContent: Story = {
  render: () => {
    return (
      <div className='h-screen bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div
                className='space-y-4 px-6 pb-6 h-full overflow-y-auto'
                data-testid='scrollable-content'
              >
                <Title>Scrollable Content</Title>
                <Description>
                  When scrolled to the top, dragging down dismisses the drawer.
                  When scrolled past the top, scroll takes priority over drag.
                </Description>
                <div className='space-y-3'>
                  {Array.from({ length: 30 }, (_, i) => (
                    <div
                      key={i}
                      className='rounded-lg border border-slate-200 bg-slate-50 p-4'
                    >
                      <h3 className='font-medium'>Item {i + 1}</h3>
                      <p className='text-sm text-slate-600'>
                        Scroll to see more items. Try dragging from the top vs
                        after scrolling.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const NoDragZone: Story = {
  render: () => {
    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-6 px-6 pb-6'>
                <Title>No-Drag Zones</Title>
                <Description>
                  The square below has{' '}
                  <code className='rounded bg-slate-100 px-1 text-xs'>
                    data-drawer-no-drag
                  </code>{' '}
                  attribute which disables drag interactions, allowing you to
                  interact with it without accidentally dragging the drawer.
                  This is useful for interactive elements like maps, sliders,
                  etc.
                </Description>
                <div
                  data-drawer-no-drag
                  data-testid='no-drag'
                  className='size-24 bg-amber-400'
                />
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}

export const FormElements: Story = {
  render: () => {
    return (
      <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6 h-full overflow-y-auto'>
                <Title>Form Elements</Title>
                <Description>
                  Interacting with form controls should not start a drag.
                </Description>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Text input
                    </label>
                    <input
                      type='text'
                      placeholder='Type here…'
                      data-testid='text-input'
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Textarea
                    </label>
                    <textarea
                      rows={3}
                      placeholder='Type here…'
                      data-testid='textarea'
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Select
                    </label>
                    <select
                      data-testid='select'
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
                    >
                      <option>Option A</option>
                      <option>Option B</option>
                      <option>Option C</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Content Editable
                    </label>
                    <div
                      contentEditable
                      data-testid='content-editable'
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-10'
                    />
                  </div>
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    )
  },
}
