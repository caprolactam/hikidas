import type {
  AnimatableProperties,
  SpringAnimateConfig,
} from './animate'
import type { Direction } from '../drawer/direction'
import type { TransitionablePhase, TransitionHint } from '../drawer/reducer'
import type { SnapMode } from '../drawer/snap-mode'
import { Phase, TransitionKind } from '../drawer/reducer'
import { getActiveSnapRatio } from '../drawer/snap-mode'
import { parseTransform } from '../utils/parse-transform'

// ── Types ─────────────────────────────────────────────────────

/** @internal */
export type GetVariant = (props: {
  phase: TransitionablePhase
  direction: Direction
  prevStyle: CSSStyleDeclaration
  snapMode: SnapMode
}) => AnimatableProperties

/** @internal */
export type ResolveSpringConfig = (props: {
  phase: TransitionablePhase
  transitionHint: TransitionHint
  direction: Direction
}) => SpringAnimateConfig

// ── Content variant ───────────────────────────────────────────

/** @internal */
export function getContentVariant({
  phase,
  direction,
  prevStyle,
  snapMode,
}: {
  phase: TransitionablePhase
  direction: Direction
  prevStyle: CSSStyleDeclaration
  snapMode: SnapMode
}): AnimatableProperties {
  const translateAxis = direction.axis
  const currentOffset = parseTransform(prevStyle)[translateAxis]
  const drawerSize = direction.sizeOnAxis({
    width: parseFloat(prevStyle.width),
    height: parseFloat(prevStyle.height),
  })
  const offscreenTranslate = direction.calcOffscreenTranslate(drawerSize)

  switch (phase) {
    case Phase.Opening: {
      const targetOffset = calculateSnapPointOffset(
        getActiveSnapRatio(snapMode),
        drawerSize,
        direction,
      )
      return {
        [translateAxis]: [offscreenTranslate, targetOffset],
      }
    }
    case Phase.Closing:
      return {
        [translateAxis]: [currentOffset, offscreenTranslate],
      }
    case Phase.Settling: {
      const targetOffset = calculateSnapPointOffset(
        getActiveSnapRatio(snapMode),
        drawerSize,
        direction,
      )
      return {
        [translateAxis]: [currentOffset, targetOffset],
      }
    }
  }
}

function calculateSnapPointOffset(
  ratio: number,
  drawerSize: number,
  direction: Direction,
): number {
  // ratio = 1.0 means fully extended (offset = 0)
  // ratio = 0.5 means half extended (offset halfway to offscreen)
  // ratio = 0.0 means fully hidden (offset = offscreen)
  const offscreenTranslate = direction.calcOffscreenTranslate(drawerSize)
  return offscreenTranslate * (1 - ratio)
}

// ── Overlay variant ───────────────────────────────────────────

/** @internal */
export function getOverlayVariant({
  phase,
  prevStyle,
  snapMode,
}: {
  phase: TransitionablePhase
  prevStyle: CSSStyleDeclaration
  snapMode: SnapMode
}): AnimatableProperties {
  const prevOpacity = parseFloat(prevStyle.opacity)
  const snapRatio = getActiveSnapRatio(snapMode)
  switch (phase) {
    case Phase.Opening:
      return { opacity: [0, snapRatio] }
    case Phase.Closing:
      return { opacity: [prevOpacity, 0] }
    case Phase.Settling:
      return { opacity: [prevOpacity, snapRatio] }
  }
}

// ── Spring config resolution ──────────────────────────────────

const SPRING_CONFIGS: Record<
  TransitionablePhase,
  Record<'flick' | 'other', { bounce: number; duration: number }>
> = {
  [Phase.Opening]: {
    flick: { bounce: 0, duration: 0.35 },
    other: { bounce: 0, duration: 0.35 },
  },
  [Phase.Closing]: {
    flick: { bounce: 0, duration: 0.3 },
    other: { bounce: 0, duration: 0.35 },
  },
  [Phase.Settling]: {
    flick: { bounce: 0.15, duration: 0.3 },
    other: { bounce: 0, duration: 0.25 },
  },
}

const MAX_ANIMATION_VELOCITY_PX_PER_SEC = 3000

function resolveVelocity(
  transitionHint: TransitionHint,
  direction: Direction,
): number | null {
  // For programmatic transitions, pass null to let animate use its internal velocity estimate.
  if (transitionHint.kind === TransitionKind.Programmatic) return null
  // transitionHint.velocityPxPerSec is in "dismiss-positive" space (positive = toward close).
  // For 'up'/'left', CSS dismiss direction is negative, so we must negate the velocity
  // to align with the animation range sign.
  const raw = transitionHint.velocityPxPerSec * direction.dismissSign
  return Math.min(
    Math.max(raw, -MAX_ANIMATION_VELOCITY_PX_PER_SEC),
    MAX_ANIMATION_VELOCITY_PX_PER_SEC,
  )
}

/** @internal */
export function resolveDefaultSpringConfig({
  phase,
  transitionHint,
  direction,
}: Parameters<ResolveSpringConfig>[0]): SpringAnimateConfig {
  const variant =
    transitionHint.kind === TransitionKind.Flick ? 'flick' : 'other'
  return {
    ...SPRING_CONFIGS[phase][variant],
    velocityPxPerSec: resolveVelocity(transitionHint, direction),
  }
}

/** @internal */
export function resolveOverlaySpringConfig(
  props: Parameters<ResolveSpringConfig>[0],
): SpringAnimateConfig {
  return {
    ...resolveDefaultSpringConfig(props),
    velocityPxPerSec: null, // pass velocity makes overshoot on opacity animations.
  }
}
