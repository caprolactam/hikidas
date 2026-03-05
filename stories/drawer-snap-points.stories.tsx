import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  DummyHandle,
  Title,
  Description,
  Close,
} from './drawer'

export default {
  title: 'Drawer/Snap Points',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

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
