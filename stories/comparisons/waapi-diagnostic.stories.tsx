import type { Meta, StoryObj } from '@storybook/react-vite'
import { forwardRef, useRef, useState, useLayoutEffect } from 'react'
import { spring } from '../../packages/core/src/animation/spring'
import { Track, TRAVEL, BOX_SIZE } from './components/common'

export default {
  title: 'Comparisons/WAAPI Diagnostic',
  tags: ['test'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta

type Story = StoryObj

const VELOCITY = -4

function onFinished(
  anim: Animation,
  activeRef: React.RefObject<Animation | null>,
  el: HTMLElement,
  finalValue: string,
) {
  anim.finished
    .then(() => {
      if (activeRef.current !== anim) return
      el.style.translate = finalValue
      activeRef.current = null
    })
    .catch(() => {})
    .finally(() => anim.cancel())
}

// ─── A: commitStyles (current approach) ───────────────────────────
function CommitStylesBox({ target }: { target: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<Animation | null>(null)
  const wasAnimating = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const to = target ? TRAVEL : 0

    const hadAnimation = wasAnimating.current
    const active = activeRef.current
    if (active) {
      try {
        active.commitStyles()
      } catch {}
      active.cancel()
      activeRef.current = null
    }

    const currentX =
      parseFloat(getComputedStyle(el).translate?.split(' ')[0] ?? '0') || 0
    const velocity =
      hadAnimation && currentX !== 0 && currentX !== TRAVEL ? VELOCITY : 0

    const s = spring({ duration: 600, bounce: 0.25, velocity })
    const anim = new Animation(
      new KeyframeEffect(
        el,
        [
          { translate: `${currentX}px 0px 0px` },
          { translate: `${to}px 0px 0px` },
        ],
        { duration: s.duration, easing: s.easing, fill: 'forwards' },
      ),
    )
    activeRef.current = anim
    wasAnimating.current = true
    anim.play()
    onFinished(anim, activeRef, el, `${to}px 0px 0px`)
  }, [target])

  return <Box ref={ref} color='#111' />
}

// ─── B: Math-based sampling (Motion full path) ────────────────────
function MathSamplingBox({ target }: { target: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<Animation | null>(null)
  const wasAnimating = useRef(false)
  const prevSpringRef = useRef<{
    positionAt: (t: number) => number
    startTime: number
    fromX: number
    toX: number
  } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const to = target ? TRAVEL : 0

    const hadAnimation = wasAnimating.current
    const active = activeRef.current
    let currentX = 0

    if (active && prevSpringRef.current) {
      // Math-based sampling: compute position from spring function + wall-clock time
      const { positionAt, startTime, fromX, toX } = prevSpringRef.current
      const elapsed = performance.now() - startTime
      const progress = positionAt(elapsed)
      currentX = fromX + (toX - fromX) * progress

      // Direct style write — no commitStyles, no getComputedStyle
      el.style.translate = `${currentX}px 0px 0px`
      active.cancel()
      activeRef.current = null
    }

    const velocity =
      hadAnimation && currentX !== 0 && currentX !== TRAVEL ? VELOCITY : 0

    const s = spring({ duration: 600, bounce: 0.25, velocity })
    const anim = new Animation(
      new KeyframeEffect(
        el,
        [
          { translate: `${currentX}px 0px 0px` },
          { translate: `${to}px 0px 0px` },
        ],
        { duration: s.duration, easing: s.easing, fill: 'forwards' },
      ),
    )

    prevSpringRef.current = {
      positionAt: s.positionAt,
      startTime: performance.now(),
      fromX: currentX,
      toX: to,
    }
    activeRef.current = anim
    wasAnimating.current = true
    anim.play()
    onFinished(anim, activeRef, el, `${to}px 0px 0px`)
  }, [target])

  return <Box ref={ref} color='#b91c1c' />
}

// ─── Box component ──────────────────────────────────────────────────
const Box = forwardRef<HTMLDivElement, { color: string }>(({ color }, ref) => (
  <div
    ref={ref}
    style={{
      width: BOX_SIZE,
      height: BOX_SIZE,
      backgroundColor: color,
      borderRadius: 8,
    }}
  />
))

export const CommitStylesVsMathSampling: Story = {
  render: () => {
    const [target, setTarget] = useState(false)

    return (
      <div className='min-h-screen bg-yellow-100 p-10 flex flex-col items-center gap-6'>
        <div className='text-center max-w-lg'>
          <h1 className='text-xl font-bold mb-1'>
            commitStyles vs Math Sampling
          </h1>
        </div>

        <button
          onClick={() => setTarget((t) => !t)}
          className='px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition'
        >
          {target ? '← Left' : 'Right →'}
        </button>

        <div className='flex flex-col gap-5'>
          <Track label='A: commitStyles (current)' target={target}>
            <CommitStylesBox target={target} />
          </Track>

          <Track label='B: Math sampling (Motion full path)' target={target}>
            <MathSamplingBox target={target} />
          </Track>
        </div>
      </div>
    )
  },
}
