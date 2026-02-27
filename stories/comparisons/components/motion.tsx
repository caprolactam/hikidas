import { animate } from 'motion'
import { useLayoutEffect, useRef } from 'react'
import { TRAVEL, BOX_SIZE } from './common'

export function MotionBox({ target }: { target: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return

    animate(
      ref.current,
      { x: target ? TRAVEL : 0 },
      { type: 'spring', stiffness: 110, damping: 16, mass: 1 },
    )
  }, [target])

  return (
    <div
      ref={ref}
      style={{
        width: BOX_SIZE,
        height: BOX_SIZE,
        backgroundColor: '#111',
        borderRadius: 8,
      }}
    />
  )
}
