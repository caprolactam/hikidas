import type { Direction } from '../drawer/direction'
import { getViewportSize } from '../utils/get-viewport-size'

/**
 * @internal
 * Resolves drag visual distance with rubber band and clamp.
 *
 * Sign convention: dismiss/close direction is positive.
 * - visualOffset > 0 : moving toward dismiss/close
 * - visualOffset < 0 : moving toward open
 *
 * Rubber band rules (symmetric for both directions):
 * - Opening direction (visualOffset < 0): linear up to openingRubberBandThreshold px,
 *   then rubber band applies to the excess beyond that threshold (default 0 = immediate)
 * - Dismiss direction (visualOffset > 0): null = no rubber band (dismiss enabled);
 *   number = linear up to that threshold, then rubber band on the excess
 *
 * Clamp rules:
 * - Opening direction: clamp to keep drawerRect within viewport
 * - Dismiss direction: clamp to fully hidden position
 */
export function resolveDragVisualDistance({
  dragDelta,
  direction,
  dismissRubberBandThreshold,
  openingRubberBandThreshold,
  drawerRect,
}: {
  dragDelta: { x: number; y: number }
  direction: Direction
  /**
   * Distance (px) in the dismiss direction before rubber band kicks in.
   * null = no rubber band (dismiss is enabled). 0 = immediate rubber band.
   */
  dismissRubberBandThreshold: number | null
  /** Distance (px) in the opening direction before rubber band kicks in. Default 0 = immediate. */
  openingRubberBandThreshold: number
  drawerRect: DOMRect
}): number {
  const signedDeltaTowardDismiss = direction.projectOnDismissAxis(dragDelta)
  const isClosing = signedDeltaTowardDismiss >= 0
  const deltaMagnitude = Math.abs(signedDeltaTowardDismiss)

  let offsetMagnitude: number
  if (isClosing) {
    if (
      dismissRubberBandThreshold === null ||
      deltaMagnitude <= dismissRubberBandThreshold
    ) {
      // No rubber band, or within the free range (toward min snap point): linear
      offsetMagnitude = deltaMagnitude
    } else {
      // Beyond min snap point: free range + rubber band on the excess
      const excess = deltaMagnitude - dismissRubberBandThreshold
      offsetMagnitude =
        dismissRubberBandThreshold + applyRubberBandEffect(excess)
    }
  } else {
    if (deltaMagnitude <= openingRubberBandThreshold) {
      // Within the free range (toward max snap point): linear, no rubber band
      offsetMagnitude = deltaMagnitude
    } else {
      // Beyond max snap point: free range + rubber band on the excess
      const excess = deltaMagnitude - openingRubberBandThreshold
      offsetMagnitude =
        openingRubberBandThreshold + applyRubberBandEffect(excess)
    }
  }

  const maxMagnitude = isClosing
    ? getMaxDismissOffsetUntilFullyHidden(drawerRect, direction)
    : getMaxOpeningOffsetWithinViewport(drawerRect, direction)

  const clampedMagnitude = Math.min(maxMagnitude, offsetMagnitude)

  // Restore sign: dismiss is +, opening is -
  return isClosing ? clampedMagnitude : -clampedMagnitude
}

const RUBBER_BAND_COEFFICIENT = 8

function applyRubberBandEffect(value: number): number {
  return Math.max(RUBBER_BAND_COEFFICIENT * (Math.log(value + 1) - 2), 0)
}

/**
 * Gets maximum offset in opening direction without drawer leaving viewport
 */
function getMaxOpeningOffsetWithinViewport(
  rect: DOMRect,
  direction: Direction,
): number {
  const viewport = getViewportSize()
  switch (direction.dismissToward) {
    // Opening direction is opposite of dismissToward
    case 'down':
      return rect.top
    case 'up':
      return viewport.height - rect.bottom
    case 'left':
      return viewport.width - rect.right
    case 'right':
      return rect.left
  }
}

/**
 * Gets maximum offset in dismiss direction until drawer is fully hidden
 */
function getMaxDismissOffsetUntilFullyHidden(
  rect: DOMRect,
  direction: Direction,
): number {
  const viewport = getViewportSize()
  const size = direction.sizeOnAxis(rect)

  let distanceUntilFullyHidden: number

  switch (direction.dismissToward) {
    case 'down':
      // Push down: top reaches viewport bottom
      distanceUntilFullyHidden = viewport.height - rect.top
      break
    case 'up':
      // Push up: bottom reaches viewport top (0)
      distanceUntilFullyHidden = rect.bottom
      break
    case 'left':
      // Push left: right reaches 0
      distanceUntilFullyHidden = rect.right
      break
    case 'right':
      // Push right: left reaches viewport right
      distanceUntilFullyHidden = viewport.width - rect.left
      break
    default:
      const _exhaustiveCheck: never = direction.dismissToward
      return _exhaustiveCheck
  }

  return Math.max(0, Math.min(size, distanceUntilFullyHidden))
}
