import type { RefObject } from 'react'
import {
  type DrawerMachine,
  type GetVariant,
  type ResolveSpringConfig,
  getContentVariant,
  getOverlayVariant,
  resolveDefaultSpringConfig,
  resolveOverlaySpringConfig,
} from '../core'
import { useAnimate } from './utils/use-animate'
import { useIsomorphicEffect } from './utils/use-isomorphic-effect'

interface PhaseAnimationProps {
  elementRef: RefObject<HTMLElement | null>
  machine: DrawerMachine
}

function usePhaseAnimation({
  elementRef,
  machine,
  getVariant,
  resolveSpringConfig,
}: PhaseAnimationProps & {
  getVariant: GetVariant
  resolveSpringConfig: ResolveSpringConfig
}) {
  const animate = useAnimate()

  useIsomorphicEffect(() => {
    function phaseAnimation() {
      if (!elementRef.current) return
      const element = elementRef.current

      const values = machine.registerTransitionPart()
      if (!values.isTransitionable) return

      const { phase: transitionPhase, reportComplete, reportCancel } = values

      const {
        config: { direction },
        transitionHint,
        snapMode,
      } = machine.snapshot

      animate
        .play(
          element,
          (prevStyle) =>
            getVariant({
              phase: transitionPhase,
              direction,
              prevStyle,
              snapMode,
            }),
          resolveSpringConfig({
            phase: transitionPhase,
            transitionHint,
            direction,
          }),
        )
        .then(reportComplete)
        .catch(reportCancel)
    }

    // Since the subscription to the machine occurs after the component has mounted,
    // we need to invoke the phase animation manually on mount.
    phaseAnimation()

    return machine.subscribePhaseChange(phaseAnimation)
  }, [machine, animate, getVariant, resolveSpringConfig, elementRef])
}

/** @internal */
export function useContentAnimation(props: PhaseAnimationProps) {
  return usePhaseAnimation({
    ...props,
    getVariant: getContentVariant,
    resolveSpringConfig: resolveDefaultSpringConfig,
  })
}

/** @internal */
export function useOverlayAnimation(props: PhaseAnimationProps) {
  return usePhaseAnimation({
    ...props,
    getVariant: getOverlayVariant,
    resolveSpringConfig: resolveOverlaySpringConfig,
  })
}
