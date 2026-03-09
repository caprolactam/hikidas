import type { RefObject } from 'react'
import {
  type DrawerMachine,
  setupContentAnimation,
  setupOverlayAnimation,
} from '../core'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'

interface PhaseAnimationProps {
  elementRef: RefObject<HTMLElement | null>
  machine: DrawerMachine
}

/** @internal */
export function useContentAnimation({ elementRef, machine }: PhaseAnimationProps) {
  useIsomorphicEffect(() => {
    if (!elementRef.current) return
    return setupContentAnimation({ machine, element: elementRef.current })
  }, [machine, elementRef])
}

/** @internal */
export function useOverlayAnimation({ elementRef, machine }: PhaseAnimationProps) {
  useIsomorphicEffect(() => {
    if (!elementRef.current) return
    return setupOverlayAnimation({ machine, element: elementRef.current })
  }, [machine, elementRef])
}
