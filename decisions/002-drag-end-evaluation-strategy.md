# 002: Drag End Evaluation Strategy

## Status

Accepted

## Context

When a user releases a drag gesture on the drawer, the system must decide where the drawer should land: the current snap point, an adjacent snap point, or fully closed (dismissed). This decision depends on two inputs — the drawer's current visual position and the velocity of the gesture at release.

There are two broad strategies for combining these inputs. One merges them into a single projected position via a momentum formula; the other evaluates them as separate conditions. This decision compares both approaches and selects the one better suited for a general-purpose drawer library.

### Coordinate system: "ratio"

Both approaches operate in "ratio" units — position and velocity divided by `drawerSize` — so that thresholds are dimensionless and independent of the drawer's pixel size on any given device. A ratio of 1.0 means the drawer is at its default (fully open) snap point; 0 means fully closed. Velocity in ratio/s represents "how many full drawer heights per second."

## Decision

**Adopt a two-condition (velocity-first, position-second) evaluation**, modeled after the pattern used by Apple's `UISheetPresentationController`. Sequential snap point movement (one step at a time) becomes the default behavior.

## Alternatives Considered

### A. Unified momentum projection

Position and velocity are combined into a single projected position:

```js
projectedRatio = positionRatio − velocityRatioPerSec × MOMENTUM_DECAY_TIME
```

The nearest snap point to this projection becomes the target.

**Advantages:**

- Mathematically principled: a single formula integrates "where the finger is" and "how fast it's moving" into one continuous value
- Produces a smooth, natural coasting feel — the projected position is an analog interpolation rather than a binary switch
- Works well in the binary (open/close) case, where there are no intermediate snap points to skip

**Disadvantages:**

- Requires compensating guards that exist solely to correct the formula's own side effects:
  - **Reverse swipe override**: an explicit check to cancel momentum when the user reverses direction mid-drag, because the projection would otherwise land on the wrong snap point
  - **Minimum dismiss velocity guard**: prevents accidental dismissal when a strong flick from a high snap point causes the projection to land below the dismiss threshold, even though the user's intent was likely to reach the lowest snap point
- Permits **multi-step snap point jumps** by default. With snap points at [0.3, 0.6, 1.0], a moderate flick from 1.0 can project to 0.3, skipping the intermediate 0.6. This is counterintuitive when the intermediate state has semantic meaning (e.g., a "peek" height)
- An opt-in `snapToSequentialPoints` flag could mitigate multi-step jumps, but this inverts the safe default: the dangerous behavior is the default, and the safe behavior is opt-in
- The formula's constants (`MOMENTUM_DECAY_TIME`, `REVERSE_SWIPE_THRESHOLD`, `MIN_DISMISS_VELOCITY`) interact in non-obvious ways, making tuning difficult

### B. Two-condition: velocity-first, position-second (chosen)

The evaluation uses two sequential conditions:

1. **Velocity-driven**: if the gesture velocity exceeds a threshold, move one step in the velocity's direction regardless of position
2. **Position-driven**: if velocity is below the threshold, find the nearest snap point based on the current visual position alone (no projection)

**Advantages:**

- Sequential snap point movement is the natural default — the velocity-driven path moves exactly one step, and the position-driven path resolves to the nearest point from the current position
- No compensating guards needed:
  - Reverse swipe is handled naturally: a negative velocity in the velocity-driven step moves toward open, not toward close
  - The minimum dismiss velocity problem disappears: dismissal only occurs when velocity actively exceeds the threshold toward close, or when the position is already past the midpoint
- Each condition is independently understandable: "fast enough → move one step" and "not fast enough → snap to nearest"
- Matches the established pattern of Apple's `UISheetPresentationController`, which has been validated across billions of devices
- Simpler to tune: the velocity threshold is the primary knob, and position-based snapping uses straightforward nearest-point logic

**Disadvantages:**

- The transition between velocity-driven and position-driven paths is discrete: a gesture at 499 px/s and 501 px/s (assuming a 500 px/s threshold) produce categorically different outcomes. The projection formula handles this range continuously
- Loses the smooth coasting feel of momentum projection in edge cases where the velocity is moderate and the position is between snap points
- Less mathematically elegant — two separate code paths instead of one formula

## Rationale

The projection formula's core assumption — that velocity and position should be merged into a single continuous value — is a good fit for physics simulations and scrolling UIs where the target is a continuous range. Drawer snap point evaluation is a different problem: the target is one of a small, discrete set of positions (typically 2–3), and intermediate states carry semantic meaning.

In this discrete-target context, the projection formula's continuity becomes a liability: it can overshoot meaningful snap points, and the guards it would require (reverse swipe override, minimum dismiss velocity) are symptoms of the abstraction mismatch. Code that needs workarounds to suppress its own default behavior suggests the wrong primitive.

The two-condition approach treats the problem as what it is — a discrete classification — and produces correct defaults without compensating logic. The velocity threshold's discontinuity (the main theoretical disadvantage) is imperceptible in practice: users either flick decisively or release gently, and the threshold sits in the gap between these natural gesture clusters.

|                          | Projection                      | Two-condition                 |
| ------------------------ | ------------------------------- | ----------------------------- |
| Default multi-step jumps | Yes (requires opt-out)          | No (one step per gesture)     |
| Compensating guards      | 2 (reverse swipe, min velocity) | 0                             |
| Dismiss safety           | Needs minimum velocity guard    | Velocity threshold handles it |
| Tuning complexity        | 5 interacting constants         | 1 primary threshold           |
| Continuous feel          | Smooth interpolation            | Discrete but imperceptible    |
| Apple precedent          | No                              | Yes                           |
