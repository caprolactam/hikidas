import {
  nestingReducer,
  nestingReducerInit,
  type NestingState,
  type NestingEvent,
  NestingPhase,
  NESTING_DEPTH_CHANGED,
  NESTING_DEPTH_COMMITTED,
  NESTING_TRANSITION_COMPLETE,
  NESTING_ENTER_DRAG_CONTROLLED,
  NESTING_RESTORE_FROM_DRAG,
} from './reducer'

type TransitionableNestingState = Extract<
  NestingState,
  { phase: typeof NestingPhase.Scaling | typeof NestingPhase.DragRestoring }
>

/** @internal */
export interface NestingTransitionHandle {
  readonly state: TransitionableNestingState
  done(): void
}

function isTransitionableNestingState(
  state: NestingState,
): state is TransitionableNestingState {
  return (
    state.phase === NestingPhase.Scaling ||
    state.phase === NestingPhase.DragRestoring
  )
}

/** @internal */
export class NestingMachine {
  #state: NestingState
  #listeners = new Set<(phase: NestingPhase) => void>()
  #transitionId = 0
  #pendingJoinCount = 0

  constructor(initialDepth: number) {
    this.#state = nestingReducerInit(initialDepth)
  }

  get snapshot(): NestingState {
    return this.#state
  }

  /**
   * Join the current nesting transition. Returns a handle if the machine is
   * in a transitionable phase (Scaling or DragRestoring), or null otherwise.
   * The caller must invoke `handle.done()` when its animation completes.
   */
  joinTransition(): NestingTransitionHandle | null {
    if (!isTransitionableNestingState(this.#state)) return null

    const id = this.#transitionId
    const state = this.#state
    this.#pendingJoinCount++

    let settled = false
    return {
      state,
      done: () => {
        if (settled) return
        settled = true
        if (this.#transitionId !== id) return
        this.#pendingJoinCount--
        if (this.#pendingJoinCount === 0) {
          this.#dispatch({ type: NESTING_TRANSITION_COMPLETE })
        }
      },
    }
  }

  subscribe = (listener: (phase: NestingPhase) => void): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  depthChanged(targetDepth: number): void {
    this.#dispatch({ type: NESTING_DEPTH_CHANGED, targetDepth })
  }

  /** Called by registry during initial registration — immediate commit, no animation. */
  depthCommitted(depth: number): void {
    this.#dispatch({ type: NESTING_DEPTH_COMMITTED, depth })
  }

  enterDragControlled(): void {
    this.#dispatch({ type: NESTING_ENTER_DRAG_CONTROLLED })
  }

  restoreFromDrag(): void {
    this.#dispatch({ type: NESTING_RESTORE_FROM_DRAG })
  }

  #dispatch(event: NestingEvent): void {
    const prev = this.#state
    const next = nestingReducer(prev, event)
    if (next === prev) return

    this.#state = next

    // Start a new transition whenever entering (or re-entering) a transitionable phase.
    // Scaling→Scaling redirect (different target) produces a new state object,
    // so the early-return above already filters same-target no-ops.
    if (isTransitionableNestingState(next)) {
      this.#startTransition()
    }

    for (const listener of this.#listeners) {
      listener(next.phase)
    }
  }

  #startTransition(): void {
    ++this.#transitionId
    this.#pendingJoinCount = 0
  }
}
