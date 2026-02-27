import { parseTransform } from '../utils/parse-transform'
import { spring } from './spring'

type TranslateKeys = 'x' | 'y' | 'z'
/** @internal */
export type AnimatablePropertyKeys = 'opacity' | TranslateKeys
type FromToValue = [number, number]
/** @internal */
export type AnimatableProperties = {
  [K in AnimatablePropertyKeys]?: FromToValue
}
interface ResolvedProperty {
  cssProperty: string
  pairs: FromToValue[]
  format: (values: number[]) => string
}

type ResolvedAnimatableProperties = ResolvedProperty[]

/** @internal */
export interface SpringAnimateConfig {
  bounce: number
  duration: number
  /** Initial velocity in px/s. Converted internally to spring's normalized units/s. */
  velocityPxPerSec: number | null
}

/** @internal */
export interface AnimateReturn {
  play: (
    element: HTMLElement,
    properties:
      | AnimatableProperties
      | ((prevStyle: CSSStyleDeclaration) => AnimatableProperties),
    config: SpringAnimateConfig,
  ) => Promise<void>
  cleanup: () => void
}

/** @internal */
export function initAnimate() {
  let element: HTMLElement | undefined
  let activeAnimation: Animation | null = null
  let prevVelocityAt: ((t: number) => number) | null = null
  let prevPositionAt: ((t: number) => number) | null = null
  let prevStartTime = 0
  let prevResolvedProperties: ResolvedAnimatableProperties | null = null
  let prevDominantRange = 0
  let prevEstimatedVelocity: number | null = null

  const stop = () => {
    const active = activeAnimation
    if (!active) return

    const elapsed = performance.now() - prevStartTime
    if (prevVelocityAt && elapsed > 0) {
      prevEstimatedVelocity = prevVelocityAt(elapsed)
    } else {
      prevEstimatedVelocity = null
    }

    // Math-based position sampling — write directly to element.style
    // instead of commitStyles() to avoid compositor sync issues in Chrome
    // src/stories/comparisons/waapi-diagnostic.stories.tsx
    if (element && prevPositionAt && prevResolvedProperties) {
      const progress = prevPositionAt(elapsed)
      writeInterpolatedStyles(element, prevResolvedProperties, progress)
    }

    active.cancel()
    activeAnimation = null
  }

  return {
    play: async (
      target: HTMLElement,
      properties:
        | AnimatableProperties
        | ((prevStyle: CSSStyleDeclaration) => AnimatableProperties),
      config: SpringAnimateConfig,
    ) => {
      element = target

      stop()

      const computedStyle = window.getComputedStyle(target)

      const resolvedProperties = resolveProperties(
        typeof properties === 'function'
          ? properties(computedStyle)
          : properties,
        computedStyle,
      )

      const durationMs = config.duration * 1000

      const newDominantRange = getDominantRange(resolvedProperties)
      const estimatedVelocity =
        newDominantRange === 0
          ? 0
          : ((prevEstimatedVelocity ?? 0) * prevDominantRange) /
            newDominantRange
      const velocity =
        config.velocityPxPerSec == null
          ? estimatedVelocity
          : newDominantRange === 0
            ? 0
            : config.velocityPxPerSec / newDominantRange

      const springResult = spring({
        duration: durationMs,
        bounce: config.bounce,
        velocity: velocity ?? 0,
      })

      const keyframes = toKeyframes(resolvedProperties)

      prevVelocityAt = springResult.velocityAt
      prevPositionAt = springResult.positionAt
      prevResolvedProperties = resolvedProperties
      prevDominantRange = getDominantRange(resolvedProperties)
      prevEstimatedVelocity = null

      const animation = new Animation(
        new KeyframeEffect(target, keyframes, {
          ...springResult,
          fill: 'forwards',
        }),
      )

      activeAnimation = animation
      animation.play()
      prevStartTime = performance.now()

      return animation.finished
        .then(() => {
          if (activeAnimation !== animation) return
          writeFinalStyles(target, resolvedProperties)
          activeAnimation = null
          animation.cancel()
        })
        .catch((reason) => {
          if (activeAnimation !== animation) return
          activeAnimation = null
          animation.cancel()

          throw reason
        })
    },
    cleanup: stop,
  }
}

const TRANSLATE_KEYS: readonly TranslateKeys[] = ['x', 'y', 'z']

function resolveProperties(
  properties: AnimatableProperties,
  currentStyle: CSSStyleDeclaration,
): ResolvedAnimatableProperties {
  const result: ResolvedAnimatableProperties = []

  const hasTranslateKey = TRANSLATE_KEYS.some((key) => key in properties)
  if (hasTranslateKey) {
    const current = parseTransform(currentStyle)
    result.push({
      cssProperty: 'transform',
      pairs: TRANSLATE_KEYS.map(
        (key) => properties[key] ?? [current[key], current[key]],
      ),
      format: ([x, y, z]) =>
        `translateX(${x}px) translateY(${y}px) translateZ(${z}px)`,
    })
  }

  for (const [key, value] of Object.entries(properties)) {
    if (!value || (TRANSLATE_KEYS as readonly string[]).includes(key)) continue
    result.push({
      cssProperty: key,
      pairs: [value],
      format: ([v]) => String(v),
    })
  }

  return result
}

function toKeyframes(resolved: ResolvedAnimatableProperties): Keyframe[] {
  const from: Keyframe = {}
  const to: Keyframe = {}
  for (const { cssProperty, pairs, format } of resolved) {
    from[cssProperty] = format(pairs.map((p) => p[0]))
    to[cssProperty] = format(pairs.map((p) => p[1]))
  }
  return [from, to]
}

function writeInterpolatedStyles(
  target: HTMLElement,
  resolved: ResolvedAnimatableProperties,
  progress: number,
) {
  for (const { cssProperty, pairs, format } of resolved) {
    const values = pairs.map(([f, t]) => f + (t - f) * progress)
    ;(target.style as unknown as Record<string, string>)[cssProperty] =
      format(values)
  }
}

function writeFinalStyles(
  target: HTMLElement,
  resolved: ResolvedAnimatableProperties,
) {
  for (const { cssProperty, pairs, format } of resolved) {
    ;(target.style as unknown as Record<string, string>)[cssProperty] = format(
      pairs.map((p) => p[1]),
    )
  }
}

/** Returns the signed difference of the [from, to] pair with the largest absolute value. */
function getDominantRange(resolved: ResolvedAnimatableProperties): number {
  let dominant = 0
  for (const { pairs } of resolved) {
    for (const pair of pairs) {
      const range = pair[1] - pair[0]
      if (Math.abs(range) > Math.abs(dominant)) dominant = range
    }
  }
  return dominant
}
