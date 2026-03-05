import type { Direction } from './direction'

/** @internal */
export const Phase = {
  Closed: 'closed',
  Opening: 'opening',
  Idle: 'idle',
  Tracking: 'tracking',
  Dragging: 'dragging',
  Settling: 'settling',
  Closing: 'closing',
} as const

/** @internal */
export type Phase = (typeof Phase)[keyof typeof Phase]

/** @internal */
export const TransitionKind = {
  Flick: 'flick',
  Release: 'release',
  Programmatic: 'programmatic',
} as const

/** @internal */
export type TransitionKind =
  (typeof TransitionKind)[keyof typeof TransitionKind]

/** @internal */
export type TransitionHint =
  | { kind: typeof TransitionKind.Flick; velocityPxPerSec: number }
  | { kind: typeof TransitionKind.Release; velocityPxPerSec: number }
  | { kind: typeof TransitionKind.Programmatic }

/** @internal */
export type TransitionablePhase =
  | typeof Phase.Opening
  | typeof Phase.Closing
  | typeof Phase.Settling

/** @internal */
export interface DrawerConfig {
  disableDragDismiss: boolean
  direction: Direction
}

/** @internal */
export interface EndDragPayload {
  /** Drag end velocity in px/s (positive = toward dismiss direction) */
  velocityPxPerSec: number
  /** True when velocity tracker returned null (e.g. stale after 100ms idle). Velocity should be treated as zero. */
  isVelocityStale: boolean
  /** Visual drag distance actually reflected in the UI, as a ratio of constrained drawer size (signed, positive = dismiss direction) */
  dragDistanceRatio: number
  /** Constrained drawer size in px on the drag axis at drag end */
  drawerSize: number
}

/** @internal */
export function isOpenPhase(phase: Phase): boolean {
  return phase !== Phase.Closed
}

/** @internal */
export function isTransitionablePhase(
  phase: Phase,
): phase is TransitionablePhase {
  return (
    phase === Phase.Opening ||
    phase === Phase.Closing ||
    phase === Phase.Settling
  )
}
