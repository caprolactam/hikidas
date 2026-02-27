import type { ReactNode } from 'react'

export const TRAVEL = 300
export const BOX_SIZE = 72

export function Track({
  label,
  target,
  children,
}: {
  label: string
  target: boolean
  children: ReactNode
}) {
  const padding = 20

  return (
    <div>
      <p className='text-sm font-mono font-semibold mb-2 text-gray-700'>
        {label}
      </p>
      <div
        className='relative bg-white border border-gray-300 rounded-lg'
        style={{
          height: BOX_SIZE + padding * 2,
          width: TRAVEL + BOX_SIZE + padding * 2,
        }}
      >
        <div
          className='absolute border-2 border-dashed border-gray-400 rounded'
          style={{
            width: BOX_SIZE,
            height: BOX_SIZE,
            top: padding,
            left: padding + (target ? TRAVEL : 0),
          }}
        />
        <div className='absolute' style={{ top: padding, left: padding }}>
          {children}
        </div>
      </div>
    </div>
  )
}
