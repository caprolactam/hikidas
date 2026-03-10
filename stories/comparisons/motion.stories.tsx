import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, useLayoutEffect, useRef } from 'react'
import { initAnimate } from '../../src/core/animation/animate'
import { useStatic } from '../../src/react/utils/use-static'
import { Track, TRAVEL, BOX_SIZE } from './components/common'
import { MotionBox } from './components/motion'
import { ReactSpringBox } from './components/react-spring'
import { parseTransform } from './parse-transform'

export default {
  title: 'Comparisons/Spring Reversal',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

function OurAnimateBox({ target }: { target: boolean }) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const animate = useStatic(() => initAnimate())

  useLayoutEffect(() => {
    return animate.cleanup
  }, [animate])

  useLayoutEffect(() => {
    if (!elementRef.current) return
    const element = elementRef.current

    const to = target ? TRAVEL : 0

    animate.play(
      element,
      (prevStyle) => {
        const prevX = parseTransform(prevStyle).x
        return { x: [prevX, to] }
      },
      {
        bounce: 0.25,
        duration: 0.6,
        velocityPxPerSec: null,
      },
    )
  }, [target, animate])

  return (
    <div
      ref={elementRef}
      style={{
        width: BOX_SIZE,
        height: BOX_SIZE,
        backgroundColor: '#111',
        borderRadius: 8,
      }}
    />
  )
}

export const SpringReversal: Story = {
  render: () => {
    const [target, setTarget] = useState(false)

    return (
      <div className='min-h-screen bg-yellow-100 p-10 flex flex-col items-center gap-6'>
        <div className='text-center max-w-lg'>
          <h1 className='text-xl font-bold mb-1'>
            Spring Animation: Mid-animation Reversal
          </h1>
        </div>

        <button
          onClick={() => setTarget((t) => !t)}
          className='px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition'
        >
          {target ? '← Left' : 'Right →'}
        </button>

        <div className='flex flex-col gap-5'>
          <Track label='Using useAnimate (ours)' target={target}>
            <OurAnimateBox target={target} />
          </Track>

          <Track label='Using React Spring' target={target}>
            <ReactSpringBox target={target} />
          </Track>

          <Track label='Using Motion' target={target}>
            <MotionBox target={target} />
          </Track>
        </div>
      </div>
    )
  },
}
