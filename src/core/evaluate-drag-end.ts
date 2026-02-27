import {
  Phase,
  TransitionKind,
  type TransitionHint,
  type DrawerConfig,
  type EndDragPayload,
} from './reducer'
import {
  getActiveSnapRatio,
  getMinSnapRatio,
  normalizeSnapMode,
  resolveNextSnapMode,
  type SnapMode,
} from './snap-mode'

// ── Definitions: "ratio" ──────────────────────────────────────────────
// Positions and velocities throughout this file are expressed in "ratio" units:
//   ratio = px / drawerSize  (dimensionless)
// A ratio of 1.0 means the drawer is at its default (fully open) snap point;
// 0 means fully closed. Snap points are stored as ratios,
// threshold comparisons must use the same unit.
//
// Why ratio/s instead of the raw velocityPxPerSec?
//   A px/s velocity is device-dependent: the same finger-flick produces a larger
//   number on a bigger screen, making numeric thresholds brittle across devices.
//   Dividing by drawerSize yields ratio/s — a device-independent unit where
//   1.0 ratio/s means "crosses the full drawer height in one second", regardless
//   of physical screen size. Constants defined below are therefore stable across
//   all device sizes.

/** @internal */
export type DragEndEvaluation =
  | { phase: Phase.Closing; transitionHint: TransitionHint }
  | {
      phase: Phase.Settling
      snapMode: SnapMode
      transitionHint: TransitionHint
    }

/** @internal */
export function evaluateDragEnd(
  payload: EndDragPayload,
  snapMode: SnapMode,
  config: DrawerConfig,
): DragEndEvaluation {
  const { velocityPxPerSec, dragDistanceRatio, drawerSize, isVelocityStale } =
    payload

  const rawVelocityRatio = drawerSize > 0 ? velocityPxPerSec / drawerSize : 0
  const velocityRatioPerSec = isVelocityStale ? 0 : rawVelocityRatio

  const { ratios } = normalizeSnapMode(snapMode)
  const currentRatio = getActiveSnapRatio(snapMode)
  const lowestRatio = getMinSnapRatio(snapMode)

  const target = resolveTarget(
    ratios,
    currentRatio,
    lowestRatio,
    dragDistanceRatio,
    velocityRatioPerSec,
    config,
  )

  return buildResult(target, snapMode, velocityPxPerSec, velocityRatioPerSec)
}

const VELOCITY_THRESHOLD = 0.5
type DragTarget = { kind: 'close' } | { kind: 'snap'; index: number }

function resolveTarget(
  ratios: number[],
  currentRatio: number,
  lowestRatio: number,
  dragDistanceRatio: number,
  velocityRatioPerSec: number,
  config: DrawerConfig,
): DragTarget {
  const visualPositionRatio = currentRatio - dragDistanceRatio
  const isDismissable = !config.disableDragDismiss

  if (Math.abs(velocityRatioPerSec) >= VELOCITY_THRESHOLD) {
    const isClosing = velocityRatioPerSec > 0
    if (isClosing) {
      // Dismiss direction: ceiling snap is the lowest snap ≥ visualPositionRatio.
      // This is the snap the drawer is "resting against" from above; the flick
      // moves one step further toward dismiss from there.
      const base = findSnapCeiling(ratios, visualPositionRatio)

      if (base === 0 && isDismissable) {
        return { kind: 'close' }
      }
      return { kind: 'snap', index: Math.max(0, base - 1) }
    } else {
      // Open direction: floor snap is the highest snap ≤ visualPositionRatio.
      // Move one step further toward open from there.
      const base = findSnapFloor(ratios, visualPositionRatio)
      return { kind: 'snap', index: Math.min(ratios.length - 1, base + 1) }
    }
  }

  const nearestIndex = findNearestSnapIndex(ratios, visualPositionRatio)

  if (
    nearestIndex === 0 &&
    visualPositionRatio < lowestRatio / 2 &&
    isDismissable
  ) {
    return { kind: 'close' }
  }

  return { kind: 'snap', index: nearestIndex }
}

const FLICK_VELOCITY_THRESHOLD = 0.3

function buildResult(
  target: DragTarget,
  snapMode: SnapMode,
  velocityPxPerSec: number,
  velocityRatioPerSec: number,
): DragEndEvaluation {
  const isFlick = Math.abs(velocityRatioPerSec) >= FLICK_VELOCITY_THRESHOLD
  const transitionKind = isFlick ? TransitionKind.Flick : TransitionKind.Release

  switch (target.kind) {
    case 'close':
      return {
        phase: Phase.Closing,
        transitionHint: { kind: transitionKind, velocityPxPerSec },
      }
    case 'snap':
      return {
        phase: Phase.Settling,
        snapMode: resolveNextSnapMode(snapMode, target.index),
        transitionHint: { kind: transitionKind, velocityPxPerSec },
      }
    default:
      const _exhaustiveCheck: never = target
      return _exhaustiveCheck
  }
}

function findSnapCeiling(
  ratios: number[],
  visualPositionRatio: number,
): number {
  for (let i = 0; i < ratios.length; i++) {
    if (ratios[i]! >= visualPositionRatio) return i
  }
  return ratios.length - 1
}

function findSnapFloor(ratios: number[], visualPositionRatio: number): number {
  for (let i = ratios.length - 1; i >= 0; i--) {
    if (ratios[i]! <= visualPositionRatio) return i
  }
  return 0
}

function findNearestSnapIndex(ratios: number[], targetRatio: number): number {
  let bestIndex = 0
  let bestDistance = Math.abs(ratios[0]! - targetRatio)

  for (let i = 1; i < ratios.length; i++) {
    const distance = Math.abs(ratios[i]! - targetRatio)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }

  return bestIndex
}
