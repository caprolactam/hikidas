import { createDirection } from './direction'
import {
  drawerReducer,
  drawerReducerInit,
  type DrawerConfig,
  type DrawerConfigInput,
  type DrawerState,
  type DrawerEvent,
  type Phase,
  type TransitionablePhase,
  type EndDragPayload,
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
import { TransitionCoordinator } from './transition-coordinator'

interface DrawerSnapshot extends DrawerState {}

type PhaseChangeListener = (nextPhase: Phase) => void
type SnapModeChangeListener = (nextSnapMode: SnapMode) => void

/** @internal */
export class DrawerMachine {
  #reducerState: DrawerState
  #phaseChangeListeners = new Set<PhaseChangeListener>()
  #snapModeChangeListeners = new Set<SnapModeChangeListener>()
  #transitionCoordinator = new TransitionCoordinator({
    onTransitionComplete: (phase) => {
      this.#transitionComplete(phase)
    },
  })

  constructor(
    initialOpen: boolean,
    initialSnapPoints: {
      snapPoints: number[] | undefined
      snapPointIndex: number | undefined
    },
    initialConfig: DrawerConfigInput,
  ) {
    this.#reducerState = drawerReducerInit({
      initialOpen,
      initialSnapPoints,
      config: DrawerMachine.#normalizeConfig(initialConfig),
    })
  }

  get snapshot(): DrawerSnapshot {
    return this.#reducerState
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
    const prev = this.#reducerState.phase
    this.#dispatch({ type: ACTION_START_TRACKING })
    return this.#reducerState.phase !== prev
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
    const prev = this.#reducerState.phase
    this.#dispatch({ type: ACTION_START_DRAG, payload })
    return this.#reducerState.phase !== prev
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

  registerTransitionPart = () =>
    this.#transitionCoordinator.register(this.snapshot.phase)

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
    const prevPhase = this.#reducerState.phase
    const prevSnapMode = this.#reducerState.snapMode
    const nextState = drawerReducer(this.#reducerState, event)
    if (nextState === this.#reducerState) return

    this.#reducerState = nextState

    if (nextState.phase !== prevPhase) {
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

  #transitionComplete(endedPhase: TransitionablePhase): void {
    this.#dispatch({ type: ACTION_TRANSITION_COMPLETE, endedPhase })
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
