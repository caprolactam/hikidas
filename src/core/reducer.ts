import type { Direction } from './direction'
import { evaluateDragEnd } from './evaluate-drag-end'
import { type SnapMode, computeSnapMode, snapModeEquals } from './snap-mode'
import type { DismissalDirection } from './types'

/** @internal */
export const enum Phase {
  Closed = 'closed',
  Opening = 'opening',
  Idle = 'idle',
  Tracking = 'tracking',
  Dragging = 'dragging',
  Settling = 'settling',
  Closing = 'closing',
}

/** @internal */
export interface DrawerConfig {
  disableDragDismiss: boolean
  direction: Direction
}

/** @internal */
export type DrawerConfigInput = Omit<DrawerConfig, 'direction'> & {
  dismissalDirection: DismissalDirection
}

/** @internal */
export const enum TransitionKind {
  Flick = 'flick',
  Release = 'release',
  Programmatic = 'programmatic',
}

/** @internal */
export type TransitionHint =
  | { kind: TransitionKind.Flick; velocityPxPerSec: number }
  | { kind: TransitionKind.Release; velocityPxPerSec: number }
  | { kind: TransitionKind.Programmatic }

const DEFAULT_HINT: TransitionHint = {
  kind: TransitionKind.Programmatic,
}

/** @internal */
export interface DrawerState {
  phase: Phase
  snapMode: SnapMode
  config: DrawerConfig
  transitionHint: TransitionHint
}

/** @internal */
export const ACTION_OPEN_REQUEST = 1
/** @internal */
export const ACTION_CLOSE_REQUEST = 2
/** @internal */
export const ACTION_START_DRAG = 3
/** @internal */
export const ACTION_END_DRAG = 4
/** @internal */
export const ACTION_CANCEL_DRAG = 5
/** @internal */
export const ACTION_TRANSITION_COMPLETE = 6
/** @internal */
export const ACTION_UPDATE_CONFIG = 7
/** @internal */
export const ACTION_START_TRACKING = 8
/** @internal */
export const ACTION_CANCEL_TRACKING = 9
/** @internal */
export const ACTION_REQUEST_SNAP_POINT_CHANGE = 10

/** @internal */
export type DrawerEvent =
  | { type: typeof ACTION_OPEN_REQUEST }
  | { type: typeof ACTION_CLOSE_REQUEST }
  | { type: typeof ACTION_START_TRACKING }
  | { type: typeof ACTION_START_DRAG; payload: StartDragPayload }
  | {
      type: typeof ACTION_END_DRAG
      payload: EndDragPayload
    }
  | { type: typeof ACTION_CANCEL_DRAG }
  | { type: typeof ACTION_CANCEL_TRACKING }
  | {
      type: typeof ACTION_TRANSITION_COMPLETE
      endedPhase: TransitionablePhase
    }
  | {
      type: typeof ACTION_UPDATE_CONFIG
      config: Partial<DrawerConfig>
    }
  | {
      type: typeof ACTION_REQUEST_SNAP_POINT_CHANGE
      snapPoints: number[] | undefined
      activeIndex: number | undefined
    }

/** @internal */
export type TransitionablePhase = Phase.Opening | Phase.Closing | Phase.Settling

/** @internal */
export interface StartDragPayload {
  draggedDistance: { x: number; y: number }
  dragStartMinDistancePx: number
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
export function drawerReducer(
  state: DrawerState,
  event: DrawerEvent,
): DrawerState {
  const { phase, config } = state

  if (event.type === ACTION_UPDATE_CONFIG) {
    return { ...state, config: { ...config, ...event.config } }
  }

  switch (phase) {
    case Phase.Closed:
      if (event.type === ACTION_REQUEST_SNAP_POINT_CHANGE) {
        const newSnapMode = computeSnapMode(event.snapPoints, event.activeIndex)
        if (snapModeEquals(newSnapMode, state.snapMode)) {
          return state
        } else {
          return { ...state, snapMode: newSnapMode }
        }
      }
      if (event.type === ACTION_OPEN_REQUEST) {
        return { ...state, phase: Phase.Opening }
      }
      return state

    case Phase.Opening:
      if (
        event.type === ACTION_TRANSITION_COMPLETE &&
        event.endedPhase === Phase.Opening
      )
        return {
          ...state,
          phase: Phase.Idle,
          transitionHint: DEFAULT_HINT,
        }
      if (event.type === ACTION_CLOSE_REQUEST)
        return { ...state, phase: Phase.Closing }
      return state

    case Phase.Idle:
      if (event.type === ACTION_REQUEST_SNAP_POINT_CHANGE) {
        const newSnapMode = computeSnapMode(event.snapPoints, event.activeIndex)
        if (snapModeEquals(newSnapMode, state.snapMode)) {
          return state
        } else {
          // Transition to settling phase to animate the snap point change
          return {
            ...state,
            phase: Phase.Settling,
            snapMode: newSnapMode,
          }
        }
      }
      if (event.type === ACTION_START_TRACKING)
        return { ...state, phase: Phase.Tracking }
      if (event.type === ACTION_CLOSE_REQUEST)
        return { ...state, phase: Phase.Closing }
      return state

    case Phase.Tracking:
      if (event.type === ACTION_START_DRAG) {
        if (
          shouldStartDrag({
            draggedDistance: event.payload.draggedDistance,
            dragStartMinDistancePx: event.payload.dragStartMinDistancePx,
            direction: config.direction,
          })
        ) {
          return { ...state, phase: Phase.Dragging }
        } else {
          return state
        }
      }
      if (event.type === ACTION_CANCEL_TRACKING)
        return { ...state, phase: Phase.Idle }
      if (event.type === ACTION_CLOSE_REQUEST)
        return { ...state, phase: Phase.Closing }
      return state

    case Phase.Dragging:
      if (event.type === ACTION_END_DRAG) {
        const nextState = evaluateDragEnd(event.payload, state.snapMode, config)
        return {
          ...state,
          ...nextState,
        }
      }
      if (event.type === ACTION_CANCEL_DRAG) {
        return { ...state, phase: Phase.Settling, transitionHint: DEFAULT_HINT }
      }
      if (event.type === ACTION_CLOSE_REQUEST)
        return { ...state, phase: Phase.Closing, transitionHint: DEFAULT_HINT }
      return state

    case Phase.Settling:
      if (
        event.type === ACTION_TRANSITION_COMPLETE &&
        event.endedPhase === Phase.Settling
      )
        return {
          ...state,
          phase: Phase.Idle,
          transitionHint: DEFAULT_HINT,
        }
      if (event.type === ACTION_CLOSE_REQUEST)
        return { ...state, phase: Phase.Closing, transitionHint: DEFAULT_HINT }
      return state

    case Phase.Closing:
      if (
        event.type === ACTION_TRANSITION_COMPLETE &&
        event.endedPhase === Phase.Closing
      )
        return {
          ...state,
          phase: Phase.Closed,
          transitionHint: DEFAULT_HINT,
        }
      return state

    default: {
      const _exhaustiveCheck: never = phase
      return _exhaustiveCheck
    }
  }
}

/** @internal */
export function drawerReducerInit({
  initialOpen,
  initialSnapPoints: { snapPoints, snapPointIndex },
  config,
}: {
  initialOpen: boolean
  initialSnapPoints: {
    snapPoints: number[] | undefined
    snapPointIndex: number | undefined
  }
  config: DrawerConfig
}): DrawerState {
  const snapMode = computeSnapMode(snapPoints, snapPointIndex)

  return {
    phase: initialOpen ? Phase.Idle : Phase.Closed,
    snapMode,
    config,
    transitionHint: DEFAULT_HINT,
  }
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

function shouldStartDrag({
  draggedDistance: { x: deltaX, y: deltaY },
  dragStartMinDistancePx,
  direction,
}: StartDragPayload & {
  direction: Direction
}): boolean {
  const primaryDelta = direction.isHorizontal ? deltaX : deltaY
  const crossDelta = direction.isHorizontal ? deltaY : deltaX

  const absPrimaryDelta = Math.abs(primaryDelta)
  const absCrossDelta = Math.abs(crossDelta)

  const hasExceededThreshold = absPrimaryDelta >= dragStartMinDistancePx
  if (!hasExceededThreshold) {
    return false
  }

  const isPrimaryDominant = absPrimaryDelta >= absCrossDelta
  return isPrimaryDominant
}
