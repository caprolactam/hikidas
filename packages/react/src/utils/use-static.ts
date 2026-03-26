import { useRef } from 'react'

/** @internal */
export function useStatic<T>(init: () => T): T {
  const ref = useRef<T>(null)

  if (ref.current == null) ref.current = init()

  return ref.current
}
