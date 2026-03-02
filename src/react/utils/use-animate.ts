import {
  initAnimate,
} from '../../core/animation/animate'
import { useStatic } from './use-static'
import { useIsomorphicEffect } from './use-isomorphic-effect'

/** @internal */
export function useAnimate() {
  const animate = useStatic(() => initAnimate())

  useIsomorphicEffect(() => {
    return animate.cleanup
  }, [animate])

  return animate
}