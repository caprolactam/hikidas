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
} from './nesting-reducer'

/** Handle returned by `registerTransition` for animation completion reporting. */
export interface NestingTransitionHandle {
  /** Call when the scale animation has finished. */
  reportComplete: () => void
  /** Call when the animation is cancelled (e.g. unmount). */
  reportCancel: () => void
}

/** @internal */
export class NestingMachine {
  #state: NestingState
  #generation: symbol | null = null

  constructor(initialDepth: number) {
    this.#state = nestingReducerInit(initialDepth)
  }

  get snapshot(): NestingState {
    return this.#state
  }

  depthChanged(targetDepth: number): void {
    const prev = this.#state
    this.#dispatch({ type: NESTING_DEPTH_CHANGED, targetDepth })
    if (this.#state !== prev) {
      // Invalidate any in-flight transition handle — the target changed,
      // so an older handle's reportComplete must not commit a stale depth.
      this.#generation = Symbol()
    }
  }

  /** Called by registry during initial registration — immediate commit, no animation. */
  depthCommitted(depth: number): void {
    this.#dispatch({ type: NESTING_DEPTH_COMMITTED, depth })
    this.#generation = null
  }

  enterDragControlled(): void {
    this.#dispatch({ type: NESTING_ENTER_DRAG_CONTROLLED })
  }

  restoreFromDrag(): void {
    this.#dispatch({ type: NESTING_RESTORE_FROM_DRAG })
  }

  /**
   * Register interest in an animation for the current transition.
   * Returns a handle, or `null` if no animation is needed.
   */
  registerTransition(): NestingTransitionHandle | null {
    const { phase } = this.#state

    const needsTransition =
      phase === NestingPhase.Scaling || phase === NestingPhase.DragRestoring

    if (!needsTransition) return null

    const generation = Symbol()
    this.#generation = generation

    return {
      reportComplete: () => {
        if (this.#generation !== generation) return
        this.#dispatch({ type: NESTING_TRANSITION_COMPLETE })
        this.#generation = null
      },
      reportCancel: () => {
        if (this.#generation === generation) {
          this.#generation = null
        }
      },
    }
  }

  #dispatch(event: NestingEvent): void {
    const next = nestingReducer(this.#state, event)
    if (next === this.#state) return
    this.#state = next
  }
}
