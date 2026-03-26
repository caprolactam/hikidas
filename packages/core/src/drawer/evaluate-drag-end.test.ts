import { describe, expect, test } from 'vitest'
import { createDirection } from './direction'
import { evaluateDragEnd } from './evaluate-drag-end'
import {
  Phase,
  TransitionKind,
  type DrawerConfig,
  type EndDragPayload,
} from './phase'
import type { SnapMode } from './snap-mode'

const BINARY: SnapMode = { type: 'binary' }

function snap(ratios: number[], activeIndex: number): SnapMode {
  return { type: 'snap', ratios, activeIndex }
}

function config(overrides?: Partial<DrawerConfig>): DrawerConfig {
  return {
    disableDragDismiss: false,
    direction: createDirection('down'),
    ...overrides,
  }
}

function payload(overrides?: Partial<EndDragPayload>): EndDragPayload {
  return {
    velocityPxPerSec: 0,
    dragDistanceRatio: 0,
    drawerSize: 500,
    isVelocityStale: false,
    ...overrides,
  }
}

describe('evaluateDragEnd', () => {
  // ============================
  // A. Binary mode
  // ============================
  describe('binary mode', () => {
    // --- velocity-driven ---

    test('closes on flick in dismiss direction', () => {
      // VELOCITY_THRESHOLD = 0.5 ratio/s → 250 px/s for drawerSize=500
      // velocity = 300 px/s → 0.6 ratio/s → velocity-driven → one step from idx 0 → close
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Closing)
    })

    test('settles back on flick in open direction', () => {
      // velocity = -300 px/s → -0.6 ratio/s → velocity-driven → one step up
      // already at idx 0 (max in binary) → stays at idx 0
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: -300 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
    })

    test('settles back when velocity is below threshold', () => {
      // velocity = 100 px/s → 0.2 ratio/s → position-driven
      // positionRatio = 1.0, nearest = 1.0 → settle
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 100 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
    })

    // --- position-driven ---

    test('closes when dragged past the midpoint', () => {
      // positionRatio = 1.0 - 0.6 = 0.4, midpoint = 0.5 → 0.4 < 0.5 → close
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.6 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Closing)
    })

    test('settles back when dragged less than the midpoint', () => {
      // positionRatio = 1.0 - 0.4 = 0.6, nearest = 1.0, 0.6 > 0.5 → settle
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.4 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
    })

    // --- disableDragDismiss ---

    test('does not close on flick when disableDragDismiss is true', () => {
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 3000 }),
        BINARY,
        config({ disableDragDismiss: true }),
      )
      expect(result.phase).toBe(Phase.Settling)
    })

    test('does not close when dragged past midpoint with disableDragDismiss', () => {
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.8 }),
        BINARY,
        config({ disableDragDismiss: true }),
      )
      expect(result.phase).toBe(Phase.Settling)
    })
  })

  // ============================
  // B. Multi-snap mode
  // ============================
  describe('multi-snap mode', () => {
    // ratios = [0.25, 0.5, 1.0], drawerSize = 500
    const RATIOS = [0.25, 0.5, 1.0]

    // --- velocity-driven (dismiss direction) ---

    test('snaps to adjacent lower snap on dismiss flick', () => {
      // From idx 2 (1.0): velocity = 300 px/s → 0.6 ratio/s → velocity-driven
      // positionRatio = 1.0 (no drag), base = idx 2, one step down → idx 1
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 1)
    })

    test('flick dismiss uses ceiling snap as effective base', () => {
      // From idx 2 (1.0): dragDistanceRatio = 0.6 → positionRatio = 0.4
      // ceiling snap: lowest snap ≥ 0.4 → idx 1 (0.5) → base = idx 1
      // velocity = 300 px/s → velocity-driven → one step from base → idx 0
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300, dragDistanceRatio: 0.6 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 0)
    })

    test('flick dismiss closes when positionRatio reaches lowest snap', () => {
      // From idx 1 (0.5): dragDistanceRatio = 0.3 → positionRatio = 0.2
      // ceiling snap: lowest snap ≥ 0.2 → idx 0 (0.25) → base = idx 0
      // velocity = 300 px/s → velocity-driven → base is lowest and dismissable → close
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300, dragDistanceRatio: 0.3 }),
        snap(RATIOS, 1),
        config(),
      )
      expect(result.phase).toBe(Phase.Closing)
    })

    test('flick dismiss snaps to lowest when drag crossed it but dismiss is disabled', () => {
      // Same as above but dismiss disabled → stays at idx 0 instead of closing
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300, dragDistanceRatio: 0.3 }),
        snap(RATIOS, 1),
        config({ disableDragDismiss: true }),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 0)
    })

    test('closes on dismiss flick from lowest snap', () => {
      // From idx 0 (0.25): velocity = 300 px/s → velocity-driven
      // base = idx 0, isDismissable → close
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 300 }),
        snap(RATIOS, 0),
        config(),
      )
      expect(result.phase).toBe(Phase.Closing)
    })

    // --- velocity-driven (open direction) ---

    test('snaps to adjacent upper snap on open flick', () => {
      // From idx 0 (0.25): velocity = -300 px/s → -0.6 ratio/s → velocity-driven
      // positionRatio = 0.25 (no drag), base = idx 0, one step up → idx 1
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: -300 }),
        snap(RATIOS, 0),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 1)
    })

    test('flick open uses floor snap as effective base', () => {
      // From idx 0 (0.25): dragDistanceRatio = -0.35 → positionRatio = 0.60
      // floor snap: highest snap ≤ 0.60 → idx 1 (0.5) → base = idx 1
      // velocity = -300 px/s → velocity-driven → one step from base → idx 2
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: -300, dragDistanceRatio: -0.35 }),
        snap(RATIOS, 0),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 2)
    })

    test('stays at highest snap on open flick from top', () => {
      // From idx 2 (1.0): velocity = -300 px/s → velocity-driven → one step up
      // already at last index → stays at idx 2
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: -300 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 2)
    })

    // --- position-driven ---

    test('snaps to nearest lower snap on slow drag', () => {
      // From idx 2 (1.0), dragDistanceRatio=0.6 → positionRatio=0.4
      // nearest to 0.4 → 0.5 (idx 1, distance 0.1) vs 0.25 (idx 0, distance 0.15) → idx 1
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.6 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 1)
    })

    test('stays at current snap when drag is small', () => {
      // From idx 2 (1.0), dragDistanceRatio=0.2 → positionRatio=0.8
      // nearest to 0.8 → 1.0 (idx 2)
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.2 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 2)
    })

    test('position-driven snaps to nearest regardless of distance from active', () => {
      // From idx 2 (1.0), dragDistanceRatio=0.85 → positionRatio=0.15
      // nearest to 0.15 → 0.25 (idx 0, distance 0.10) vs 0.5 (idx 1, distance 0.35)
      // dismiss midpoint = 0.25/2 = 0.125, 0.15 > 0.125 → no dismiss
      // no constraint → settles at idx 0 (skipping idx 1)
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.85 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 0)
    })

    // --- dismiss via position ---

    test('closes when dragged from lowest snap past its midpoint', () => {
      // From idx 0 (0.25), dragDistanceRatio=0.2 → positionRatio=0.05
      // nearest = idx 0 (0.25), midpoint = 0.125, 0.05 < 0.125 → close
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.2 }),
        snap(RATIOS, 0),
        config(),
      )
      expect(result.phase).toBe(Phase.Closing)
    })

    test('does not close with disableDragDismiss even when dragged past midpoint', () => {
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.2 }),
        snap(RATIOS, 0),
        config({ disableDragDismiss: true }),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 0)
    })

    test('does not close on dismiss flick from lowest snap with disableDragDismiss', () => {
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 500 }),
        snap(RATIOS, 0),
        config({ disableDragDismiss: true }),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 0)
    })
  })

  // ============================
  // C. Velocity and position interaction
  // ============================
  describe('velocity and position interaction', () => {
    const RATIOS = [0.25, 0.5, 1.0]

    test('settles at highest snap on open flick with partial drag', () => {
      // From idx 2 (1.0), dragDistanceRatio=0.3 (position near 0.7),
      // velocity = -300 px/s → -0.6 ratio/s → velocity-driven → one step up → idx 2 (max)
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: -300, dragDistanceRatio: 0.3 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 2)
    })

    test('low velocity with drag snaps to nearest position', () => {
      // From idx 2 (1.0), dragDistanceRatio=0.55, velocity = 50 px/s → 0.1 ratio/s
      // positionRatio = 0.45, nearest = 0.5 (idx 1, distance 0.05) → idx 1
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 50, dragDistanceRatio: 0.55 }),
        snap(RATIOS, 2),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 1)
    })
  })

  // ============================
  // D. Transition hint
  // ============================
  describe('transition hint', () => {
    test('produces Flick kind when target changes with sufficient velocity', () => {
      // Dismiss flick → Flick
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 500 }),
        BINARY,
        config(),
      )
      expect(result.transitionHint.kind).toBe(TransitionKind.Flick)
    })

    test('produces Release kind when target changes with low velocity', () => {
      // Pure distance close, no velocity → Release
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.6 }),
        BINARY,
        config(),
      )
      expect(result.transitionHint.kind).toBe(TransitionKind.Release)
    })

    test('binary snapMode unchanged when settling', () => {
      const result = evaluateDragEnd(
        payload({ dragDistanceRatio: 0.3 }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode', BINARY)
    })
  })

  // ============================
  // E. isVelocityStale
  // ============================
  describe('stale velocity', () => {
    test('treats velocity as zero when isVelocityStale is true', () => {
      // Huge velocity but stale → position-driven only
      // positionRatio = 1.0 - 0.3 = 0.7, nearest = 1.0 → settle
      const result = evaluateDragEnd(
        payload({
          velocityPxPerSec: 9999,
          isVelocityStale: true,
          dragDistanceRatio: 0.3,
        }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result.transitionHint.kind).toBe(TransitionKind.Release)
    })
  })

  // ============================
  // F. Edge cases
  // ============================
  describe('edge cases', () => {
    test('settles when drawerSize is zero', () => {
      const result = evaluateDragEnd(
        payload({
          velocityPxPerSec: 9999,
          drawerSize: 0,
          dragDistanceRatio: 0.3,
        }),
        BINARY,
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result.transitionHint.kind).toBe(TransitionKind.Release)
    })

    test('stays at current snap with zero velocity and zero distance', () => {
      const result = evaluateDragEnd(
        payload({ velocityPxPerSec: 0, dragDistanceRatio: 0 }),
        snap([0.25, 0.5, 1.0], 1),
        config(),
      )
      expect(result.phase).toBe(Phase.Settling)
      expect(result).toHaveProperty('snapMode.activeIndex', 1)
    })
  })
})
