import { useEffect, useLayoutEffect } from 'react'

const isBrowser = typeof window !== 'undefined'

/**
 * @internal
 * https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
 */
export const useIsomorphicEffect = isBrowser ? useLayoutEffect : useEffect
