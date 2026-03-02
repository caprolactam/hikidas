import { initAnimate } from '../../core'
import { useIsomorphicEffect } from './use-isomorphic-effect'
import { useStatic } from './use-static'

/** @internal */
export function useAnimate() {
  const animate = useStatic(() => initAnimate())

  useIsomorphicEffect(() => {
    return animate.cleanup
  }, [animate])

  return animate
}
