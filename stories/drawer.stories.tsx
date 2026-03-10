import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer } from '../packages/react/src/adapters/radix-ui'
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
