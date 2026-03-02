/**
 * @internal
 *
 * Phase of a drawer's nesting state.
 *
 * Describes the lifecycle of a drawer as a parent within a nested stack
 * (i.e. "how many nesting-active descendants are stacked above me?").
 * Transitions are driven by computed nesting depth changes — which occur
 * when descendant entries are registered/unregistered, or when a
 * descendant's phase crosses the nesting-active threshold (Closing/Closed
 * are not nesting-active; all other phases are).
 *
 *   Inactive ──depth increases──→ Scaling ──anim complete──→ Active
 *      ↑                                                       │ ↑
 *      │ anim complete (depth→0)                               │ │ anim complete (depth>0)
 *      └─── Scaling ←──depth decreases────────────────────────┘ │
 *                                                                │
 *   DragControlled ←──child enters Dragging──────────── [Active]
 *        │
 *        │ cancel (child enters Settling)
 *        ↓
 *   DragRestoring ──── anim complete ──→ Active
 */
export const enum NestingPhase {
  /** No nesting-active descendants. Depth = 0. Scale = 1. */
  Inactive = 'inactive',

  /** Nesting depth is changing. Scale animating between depths. */
  Scaling = 'scaling',

  /** Nesting-active descendants present, depth committed and stable. */
  Active = 'active',

  /** Descendant is being dragged. Scale is externally controlled by DragRegistry. */
  DragControlled = 'drag-controlled',

  /** Drag cancelled. Animating scale back to committed depth. */
  DragRestoring = 'drag-restoring',
}

/**
 * @internal
 *
 * Nesting state for a drawer node, modelled as a discriminated union
 * so each phase carries only the data it needs.
 *
 * - `Inactive`: no nesting-active descendants, depth is implicitly 0.
 * - `Active`: stable nesting with committed depth.
 * - `Scaling`: depth transitioning — carries both current and target depth.
 * - `DragControlled` / `DragRestoring`: drag lifecycle with committed depth.
 */
export type NestingState =
  | { readonly phase: NestingPhase.Inactive }
  | { readonly phase: NestingPhase.Active; readonly nestingDepth: number }
  | {
      readonly phase: NestingPhase.Scaling
      readonly nestingDepth: number
      readonly targetDepth: number
    }
  | {
      readonly phase: NestingPhase.DragControlled
      readonly nestingDepth: number
    }
  | {
      readonly phase: NestingPhase.DragRestoring
      readonly nestingDepth: number
    }

/** @internal */
export const NESTING_DEPTH_CHANGED = 1
/** @internal */
export const NESTING_DEPTH_COMMITTED = 2
/** @internal */
export const NESTING_TRANSITION_COMPLETE = 3
/** @internal */
export const NESTING_ENTER_DRAG_CONTROLLED = 4
/** @internal */
export const NESTING_RESTORE_FROM_DRAG = 5

/** @internal */
export type NestingEvent =
  | { type: typeof NESTING_DEPTH_CHANGED; targetDepth: number }
  | { type: typeof NESTING_DEPTH_COMMITTED; depth: number }
  | { type: typeof NESTING_TRANSITION_COMPLETE }
  | { type: typeof NESTING_ENTER_DRAG_CONTROLLED }
  | { type: typeof NESTING_RESTORE_FROM_DRAG }

/** @internal */
export function nestingReducer(
  state: NestingState,
  event: NestingEvent,
): NestingState {
  switch (event.type) {
    case NESTING_DEPTH_CHANGED: {
      const { targetDepth } = event
      const currentTarget = getTargetDepth(state)
      if (targetDepth === currentTarget) return state

      const currentDepth = getNestingDepth(state)
      if (targetDepth === currentDepth) {
        // The new target matches the committed depth, so no animation is needed.
        // We use terminalState rather than returning `state` as-is, because the
        // current phase may not be a stable terminal phase. For example, during
        // Scaling { nestingDepth: 0, targetDepth: 1 }, if the target reverses
        // back to 0 (the committed depth), we must snap to Inactive rather than
        // leave stale Scaling state with an outdated targetDepth.
        return terminalState(targetDepth)
      }

      return {
        phase: NestingPhase.Scaling,
        nestingDepth: currentDepth,
        targetDepth,
      }
    }

    case NESTING_DEPTH_COMMITTED: {
      return terminalState(event.depth)
    }

    case NESTING_TRANSITION_COMPLETE: {
      if (state.phase === NestingPhase.DragRestoring) {
        return { phase: NestingPhase.Active, nestingDepth: state.nestingDepth }
      }
      if (state.phase === NestingPhase.Scaling) {
        return terminalState(state.targetDepth)
      }
      return state
    }

    case NESTING_ENTER_DRAG_CONTROLLED: {
      if (state.phase === NestingPhase.Inactive) return state
      return {
        phase: NestingPhase.DragControlled,
        nestingDepth: getNestingDepth(state),
      }
    }

    case NESTING_RESTORE_FROM_DRAG: {
      if (state.phase === NestingPhase.DragControlled) {
        return {
          phase: NestingPhase.DragRestoring,
          nestingDepth: state.nestingDepth,
        }
      }
      return state
    }

    default: {
      const _exhaustiveCheck: never = event
      return _exhaustiveCheck
    }
  }
}

/** @internal */
export function nestingReducerInit(depth: number): NestingState {
  return terminalState(depth)
}

const INACTIVE: NestingState = { phase: NestingPhase.Inactive }

function terminalState(depth: number): NestingState {
  return depth === 0
    ? INACTIVE
    : { phase: NestingPhase.Active, nestingDepth: depth }
}

/**
 * @internal
 *
 * Extract the committed nesting depth from any NestingState.
 * Returns 0 for Inactive.
 */
export function getNestingDepth(state: NestingState): number {
  return state.phase === NestingPhase.Inactive ? 0 : state.nestingDepth
}

/**
 * @internal
 *
 * Extract the target depth for scaling states, or the committed depth otherwise.
 * Returns 0 for Inactive.
 */
export function getTargetDepth(state: NestingState): number {
  if (state.phase === NestingPhase.Inactive) return 0
  if (state.phase === NestingPhase.Scaling) return state.targetDepth
  return state.nestingDepth
}
