const VELOCITY_CONFIG = {
  /**
   * EWMA half-life in milliseconds.
   * Controls the noise-rejection / responsiveness tradeoff.
   * At 40ms: 40ms-ago data → 50% weight, 80ms → 25%, 120ms → 12.5%.
   */
  HALF_LIFE_MS: 40,

  /**
   * Maximum time gap (ms) before velocity is considered stale.
   */
  STALE_THRESHOLD_MS: 75,

  /**
   * Minimum time delta (ms) for instantaneous velocity calculation.
   * Prevents extreme velocities from sub-millisecond event pairs
   * on high-refresh-rate devices.
   */
  MIN_DT_MS: 2,
} as const

/** @internal */
export type VelocityResult = {
  velocityPxPerMs: number
  velocityPxPerSec: number
}

interface VelocityTrackerParams {
  timeStamp: number
  /** Pointer displacement on the dismiss axis, relative to drag start */
  pointerOffset: number
}

/** @internal */
export interface VelocityTracker {
  record(params: VelocityTrackerParams): void
  end(timeStamp: number): VelocityResult | null
  cancel(): void
}

// Precomputed constant for the EWMA alpha formula:
// alpha = 1 - exp(dt * NEG_INV_HALF_LIFE)
const NEG_INV_HALF_LIFE = -1 / VELOCITY_CONFIG.HALF_LIFE_MS

/**
 * Creates a velocity tracker using Exponentially Weighted Moving Average (EWMA).
 *
 * Instead of storing an array of samples and computing endpoint deltas,
 * this maintains a running weighted velocity estimate where recent events
 * contribute exponentially more than older ones.
 *
 * The time-adaptive alpha (`1 - exp(-dt / halfLife)`) naturally handles
 * irregular pointer event intervals (60Hz, 120Hz, or jittery timing).
 *
 * Tracks raw pointer displacement on the dismiss axis rather than visual
 * drawer displacement, so velocity reflects user intent (gesture speed)
 * independently of rubber-band dampening or other visual constraints.
 *
 * `end()` does not take a final sample—the smoothed velocity from the last
 * `record()` call is returned directly. This avoids artificial dampening
 * when pointer-up fires at the same position as the last move event.
 *
 * O(1) memory · O(1) per event
 *
 * @internal
 */
export function initVelocityTracker(
  params: VelocityTrackerParams,
): VelocityTracker {
  let prevOffset = params.pointerOffset
  let prevTimeStamp = params.timeStamp
  let smoothedV = 0 // px/ms, EWMA-smoothed
  let active = true

  function update(offset: number, timeStamp: number): void {
    const dt = timeStamp - prevTimeStamp

    if (dt < VELOCITY_CONFIG.MIN_DT_MS) {
      prevOffset = offset
      return
    }

    if (dt > VELOCITY_CONFIG.STALE_THRESHOLD_MS) {
      smoothedV = 0
      prevOffset = offset
      prevTimeStamp = timeStamp
      return
    }

    const instantV = (offset - prevOffset) / dt
    const alpha = 1 - Math.exp(dt * NEG_INV_HALF_LIFE)
    smoothedV = alpha * instantV + (1 - alpha) * smoothedV

    prevOffset = offset
    prevTimeStamp = timeStamp
  }

  return {
    record({ timeStamp, pointerOffset }) {
      if (!active) return
      update(pointerOffset, timeStamp)
    },

    end(timeStamp) {
      if (!active) return null
      active = false

      if (timeStamp - prevTimeStamp > VELOCITY_CONFIG.STALE_THRESHOLD_MS) {
        return null
      }

      return { velocityPxPerMs: smoothedV, velocityPxPerSec: smoothedV * 1000 }
    },

    cancel() {
      active = false
    },
  }
}
