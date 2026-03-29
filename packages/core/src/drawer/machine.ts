import { createTransitionBarrier } from '../transition-barrier'
import { createDirection } from './direction'
import {
  type DrawerConfig,
  type Phase,
  type TransitionablePhase,
  type EndDragPayload,
  isTransitionablePhase,
} from './phase'
import {
  drawerReducer,
  drawerReducerInit,
  type DrawerConfigInput,
  type DrawerState,
  type DrawerEvent,
  ACTION_OPEN_REQUEST,
  ACTION_CLOSE_REQUEST,
  ACTION_START_TRACKING,
  ACTION_START_DRAG,
  ACTION_CANCEL_TRACKING,
  ACTION_END_DRAG,
  ACTION_CANCEL_DRAG,
  ACTION_TRANSITION_COMPLETE,
  ACTION_UPDATE_CONFIG,
  ACTION_REQUEST_SNAP_POINT_CHANGE,
} from './reducer'
import { type SnapMode } from './snap-mode'

type PhaseChangeListener = (nextPhase: Phase) => void
type SnapModeChangeListener = (nextSnapMode: SnapMode) => void

interface TransitionHandle {
  readonly phase: TransitionablePhase
  done(): void
}

/** @internal */
export class DrawerMachine {
  #state: DrawerState
  #phaseChangeListeners = new Set<PhaseChangeListener>()
  #snapModeChangeListeners = new Set<SnapModeChangeListener>()
  #transitionBarrier = createTransitionBarrier()

  constructor(
    initialOpen: boolean,
    initialSnapPoints: {
      snapPoints: number[] | undefined
      snapPointIndex: number | undefined
    },
    initialConfig: DrawerConfigInput,
  ) {
    this.#state = drawerReducerInit({
      initialOpen,
      initialSnapPoints,
      config: DrawerMachine.#normalizeConfig(initialConfig),
    })
  }

  get snapshot() {
    return this.#state
  }

  requestOpen(): void {
    this.#dispatch({ type: ACTION_OPEN_REQUEST })
  }

  requestClose(): void {
    this.#dispatch({ type: ACTION_CLOSE_REQUEST })
  }

  /**
   * Returns true if the transition succeeded.
   */
  startTracking(): boolean {
    const prev = this.#state.phase
    this.#dispatch({ type: ACTION_START_TRACKING })
    return this.#state.phase !== prev
  }

  cancelTracking(): void {
    this.#dispatch({ type: ACTION_CANCEL_TRACKING })
  }

  /**
   * Returns true if the transition succeeded.
   */
  startDrag(payload: {
    draggedDistance: { x: number; y: number }
    dragStartMinDistancePx: number
  }): boolean {
    const prev = this.#state.phase
    this.#dispatch({ type: ACTION_START_DRAG, payload })
    return this.#state.phase !== prev
  }

  endDrag(payload: EndDragPayload): void {
    this.#dispatch({ type: ACTION_END_DRAG, payload })
  }

  cancelDrag(): void {
    this.#dispatch({ type: ACTION_CANCEL_DRAG })
  }

  updateConfig(config: Partial<DrawerConfigInput>): void {
    this.#dispatch({
      type: ACTION_UPDATE_CONFIG,
      config: DrawerMachine.#normalizeConfigUpdate(config),
    })
  }

  requestSnapPointChange(
    snapPoints: number[] | undefined,
    activeIndex: number | undefined,
  ): void {
    this.#dispatch({
      type: ACTION_REQUEST_SNAP_POINT_CHANGE,
      snapPoints,
      activeIndex,
    })
  }

  /**
   * Join the current transition. Returns a handle if the machine is in a
   * transitionable phase, or null otherwise. The caller must invoke
   * `handle.done()` when its animation completes. Once all participants
   * have called `done()`, the machine dispatches ACTION_TRANSITION_COMPLETE.
   */
  joinTransition(): TransitionHandle | null {
    const { phase } = this.#state
    if (!isTransitionablePhase(phase)) return null

    const { done } = this.#transitionBarrier.join(() => {
      this.#dispatch({
        type: ACTION_TRANSITION_COMPLETE,
        endedPhase: phase,
      })
    })

    return { phase, done }
  }

  subscribePhaseChange = (listener: PhaseChangeListener): (() => void) => {
    this.#phaseChangeListeners.add(listener)
    return () => {
      this.#phaseChangeListeners.delete(listener)
    }
  }

  subscribeSnapModeChange = (
    listener: SnapModeChangeListener,
  ): (() => void) => {
    this.#snapModeChangeListeners.add(listener)
    return () => {
      this.#snapModeChangeListeners.delete(listener)
    }
  }

  #dispatch(event: DrawerEvent): void {
    const prevPhase = this.#state.phase
    const prevSnapMode = this.#state.snapMode
    const nextState = drawerReducer(this.#state, event)
    if (nextState === this.#state) return

    this.#state = nextState

    if (nextState.phase !== prevPhase) {
      if (isTransitionablePhase(nextState.phase)) {
        this.#startTransition()
      }

      for (const listener of this.#phaseChangeListeners) {
        listener(nextState.phase)
      }
    }

    if (nextState.snapMode !== prevSnapMode) {
      for (const listener of this.#snapModeChangeListeners) {
        listener(nextState.snapMode)
      }
    }
  }

  #startTransition(): void {
    this.#transitionBarrier.reset()
  }

  static #normalizeConfig(input: DrawerConfigInput): DrawerConfig {
    const { dismissalDirection, ...rest } = input
    return { ...rest, direction: createDirection(dismissalDirection) }
  }

  static #normalizeConfigUpdate(
    input: Partial<DrawerConfigInput>,
  ): Partial<DrawerConfig> {
    const { dismissalDirection, ...rest } = input
    if (dismissalDirection !== undefined) {
      return { ...rest, direction: createDirection(dismissalDirection) }
    }
    return rest
  }
}
