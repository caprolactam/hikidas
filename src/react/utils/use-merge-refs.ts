import { useCallback, type Ref } from 'react'

/** @internal */
export function useMergeRefs<T>(refs: readonly (Ref<T> | undefined)[]): Ref<T> {
  return useCallback((instance: T | null) => {
    let cleanups: Array<(() => void) | void> = []

    for (const ref of refs) {
      if (ref) {
        if (typeof ref === 'function') {
          const cleanup = ref(instance)
          cleanups.push(cleanup)
        } else {
          ref.current = instance
        }
      }
    }

    return () => {
      for (const cleanup of cleanups) {
        if (typeof cleanup === 'function') {
          cleanup()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs)
}
