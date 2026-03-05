import {
  type Phase,
  type TransitionablePhase,
  isTransitionablePhase,
} from './phase'

type TransitionId = symbol
type PartsReadiness = Map<symbol, ReadinessStatus>

const ReadinessStatus = {
  InProgress: 'in-progress',
  Ready: 'ready',
} as const

type ReadinessStatus = (typeof ReadinessStatus)[keyof typeof ReadinessStatus]

/** @internal */
export interface TransitionPartHandle {
  isTransitionable: true
  phase: TransitionablePhase
  reportComplete: () => void
  reportCancel: () => void
  unregister: () => void
}

/** @internal */
export interface InactiveTransitionResult {
  isTransitionable: false
}

interface TransitionCoordinatorCallbacks {
  onTransitionComplete: (phase: TransitionablePhase) => void
}

/** @internal */
export class TransitionCoordinator {
  #currentTransition: {
    id: TransitionId
    phase: TransitionablePhase
  } | null = null
  #readinessMap = new Map<TransitionId, PartsReadiness>()
  #callbacks: TransitionCoordinatorCallbacks

  constructor(callbacks: TransitionCoordinatorCallbacks) {
    this.#callbacks = callbacks
  }

  register(phase: Phase): TransitionPartHandle | InactiveTransitionResult {
    if (!isTransitionablePhase(phase)) return { isTransitionable: false }

    if (this.#currentTransition?.phase !== phase) {
      this.#currentTransition = {
        id: Symbol(),
        phase,
      }
    }

    const { id: currentTransitionId } = this.#currentTransition
    const partId = Symbol()

    let partsReadiness = this.#readinessMap.get(currentTransitionId)
    if (!partsReadiness) {
      partsReadiness = new Map()
      this.#readinessMap.set(currentTransitionId, partsReadiness)
    }

    partsReadiness.set(partId, ReadinessStatus.InProgress)

    const cleanupCurrentPartsReadiness = () => {
      this.#readinessMap.delete(currentTransitionId)
    }

    const getOrCleanupCurrentPartsReadiness = (): PartsReadiness | void => {
      const hasTransitionChanged =
        currentTransitionId !== this.#currentTransition?.id
      const partsReadiness = this.#readinessMap.get(currentTransitionId)
      if (hasTransitionChanged || !partsReadiness) {
        cleanupCurrentPartsReadiness()
        return
      }
      return partsReadiness
    }

    const removePart = () => {
      const partsReadiness = getOrCleanupCurrentPartsReadiness()
      if (!partsReadiness) return

      partsReadiness.delete(partId)

      if (partsReadiness.size === 0) {
        cleanupCurrentPartsReadiness()
      }
    }

    return {
      isTransitionable: true,
      phase,
      reportComplete: () => {
        const partsReadiness = getOrCleanupCurrentPartsReadiness()
        if (!partsReadiness) return

        const currentStatus = partsReadiness.get(partId)
        if (currentStatus !== ReadinessStatus.InProgress) return

        partsReadiness.set(partId, ReadinessStatus.Ready)

        const allPartsReady = everyValue(
          partsReadiness,
          (s) => s === ReadinessStatus.Ready,
        )

        if (allPartsReady) {
          this.#callbacks.onTransitionComplete(phase)
          cleanupCurrentPartsReadiness()
        }
      },
      reportCancel: removePart,
      unregister: removePart,
    }
  }
}

function everyValue<T extends Map<unknown, any>>(
  map: T,
  predicate: (value: T extends Map<unknown, infer V> ? V : never) => boolean,
): boolean {
  for (const value of map.values()) {
    if (!predicate(value)) return false
  }
  return true
}
