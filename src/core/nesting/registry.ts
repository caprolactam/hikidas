import type { DrawerMachine } from '../drawer/machine'
import { Phase, isOpenPhase } from '../drawer/phase'
import { NestingMachine } from './machine'
import { type NestingState, NestingPhase, getNestingDepth } from './reducer'

export { NestingPhase, type NestingState, getNestingDepth }

interface ActiveNestingTransitionResult {
  isTransitionable: true
  reportComplete: () => void
  reportCancel: () => void
}

interface InactiveNestingTransitionResult {
  isTransitionable: false
}

/** @internal */
export type DrawerId = string

interface DrawerRegistration {
  id: DrawerId
  parentId: DrawerId | null
  machine: DrawerMachine
}

interface DrawerNodeEntry {
  readonly id: DrawerId
  readonly parentId: DrawerId | null
  readonly machine: DrawerMachine
  readonly nestingMachine: NestingMachine
  readonly unsubscribePhase: () => void
}

interface DrawerNodeView {
  readonly id: DrawerId
  readonly parentId: DrawerId | null
  readonly depth: number
  readonly phase: Phase
  readonly nesting: NestingState
}

type ChangeListener = () => void

/** @internal */
export class DrawerRegistry {
  #entries = new Map<DrawerId, DrawerNodeEntry>()
  #listeners = new Set<ChangeListener>()

  register(registration: DrawerRegistration): () => void {
    const { id, parentId, machine } = registration

    if (__DEV__) {
      if (this.#entries.has(id)) {
        throw new Error(
          `[DrawerRegistry] Drawer "${id}" is already registered. Duplicate registration is not allowed.`,
        )
      }
      if (parentId && !this.#entries.has(parentId)) {
        console.warn(
          `[DrawerRegistry] Parent drawer "${parentId}" is not registered. Drawer "${id}" will be treated as a root until the parent is registered.`,
        )
      }
    }

    const initialDepth = this.#computeNestingDepth(id)

    const unsubPhase = machine.subscribePhaseChange(() => {
      this.#onPhaseChange(id)
    })

    const entry: DrawerNodeEntry = {
      id,
      parentId,
      machine,
      nestingMachine: new NestingMachine(initialDepth),
      unsubscribePhase: unsubPhase,
    }
    this.#entries.set(id, entry)

    // If the newly registered node is already nesting-active (e.g. initialOpen),
    // commit ancestor nesting depths immediately — no animation for initial state.
    if (parentId != null && isNestingActivePhase(machine.snapshot.phase)) {
      this.#commitAncestorNestingDepths(parentId)
    }

    this.#invalidate()

    return () => this.#unregister(id)
  }

  #unregister(id: DrawerId): void {
    const entry = this.#entries.get(id)
    if (!entry) return

    entry.unsubscribePhase()
    this.#entries.delete(id)

    // Recalculate nesting depth for ancestors — removing a node may reduce
    // the number of open descendants above an ancestor.
    if (entry.parentId != null) {
      this.#updateAncestorNestingDepths(entry.parentId)
    }

    this.#invalidate()
  }

  subscribe = (listener: ChangeListener): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #invalidate(): void {
    for (const listener of this.#listeners) {
      listener()
    }
  }

  /**
   * return null if the id is not registered, otherwise return the node view.
   */
  getNode(id: DrawerId): DrawerNodeView | null {
    const entry = this.#entries.get(id)
    return entry ? this.#toView(entry) : null
  }

  getAncestors(id: DrawerId): DrawerNodeView[] {
    const ancestors: DrawerNodeView[] = []
    let current = this.#entries.get(id)
    while (current?.parentId != null) {
      const parent = this.#entries.get(current.parentId)
      if (parent) {
        ancestors.push(this.#toView(parent))
        current = parent
      } else {
        break
      }
    }
    return ancestors
  }

  isFrontmost(id: DrawerId): boolean {
    const entry = this.#getFrontmostOpen()
    if (!entry) return false

    return entry.id === id
  }

  /**
   * @deprecated
   * replace with getNode(id)?.nesting
   */
  getNestingState(id: DrawerId): NestingState | null {
    const entry = this.#entries.get(id)
    if (!entry) return null

    return entry.nestingMachine.snapshot
  }

  registerNestingTransition(
    id: DrawerId,
  ): ActiveNestingTransitionResult | InactiveNestingTransitionResult {
    const entry = this.#entries.get(id)
    if (!entry) return { isTransitionable: false }

    const handle = entry.nestingMachine.registerTransition()
    if (!handle) return { isTransitionable: false }

    return {
      isTransitionable: true,
      reportComplete: () => {
        handle.reportComplete()
        this.#invalidate()
      },
      reportCancel: () => {
        handle.reportCancel()
      },
    }
  }

  /**
   * Coordinates cascading effects when a drawer's phase changes.
   *
   * Two directions of propagation:
   * - Downward (Closing): force-close open children so they animate out together.
   * - Upward (all phases): notify ancestors to update their scale state.
   */
  #onPhaseChange(id: DrawerId): void {
    const entry = this.#entries.get(id)
    if (!entry) return

    const phase = entry.machine.snapshot.phase

    switch (phase) {
      // When a drawer starts closing, propagate close to all direct open children.
      // Each child's own #onPhaseChange will recurse to grandchildren automatically.
      case Phase.Closing:
        for (const child of this.#entries.values()) {
          if (
            child.parentId === id &&
            isOpenPhase(child.machine.snapshot.phase)
          ) {
            child.machine.requestClose()
          }
        }
        break

      // Warn if a sibling is already open (one open child at a time constraint)
      case Phase.Opening:
        if (__DEV__ && entry.parentId != null) {
          for (const sibling of this.#entries.values()) {
            if (
              sibling.parentId === entry.parentId &&
              sibling.id !== id &&
              isOpenPhase(sibling.machine.snapshot.phase)
            ) {
              console.warn(
                `[DrawerRegistry] Drawer "${id}" is opening while sibling "${sibling.id}" is already open. ` +
                  `Only one child drawer should be open at a time.`,
              )
              break
            }
          }
        }
        break

      case Phase.Dragging:
        if (entry.parentId != null) {
          this.#enterAncestorDragControlled(entry.parentId)
        }
        break

      case Phase.Settling:
        if (entry.parentId != null) {
          this.#restoreAncestorsFromDrag(entry.parentId)
        }
        break
      default:
        break
    }

    if (entry.parentId) this.#updateAncestorNestingDepths(entry.parentId)
    this.#invalidate()
  }

  #enterAncestorDragControlled(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      entry.nestingMachine.enterDragControlled()

      currentId = entry.parentId
    }
  }

  #restoreAncestorsFromDrag(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      entry.nestingMachine.restoreFromDrag()

      currentId = entry.parentId
    }
  }

  /**
   * Recalculate targetNestingDepth for a node and all its ancestors.
   * Also sets the appropriate nesting phase when depth changes.
   */
  #updateAncestorNestingDepths(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      const newDepth = this.#computeNestingDepth(entry.id)
      entry.nestingMachine.depthChanged(newDepth)

      currentId = entry.parentId
    }
  }

  /**
   * Like #updateAncestorNestingDepths but commits both depth and target
   * immediately (no animation). Used during registration when the initial
   * state is already established and no transition animation makes sense.
   */
  #commitAncestorNestingDepths(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      const newDepth = this.#computeNestingDepth(entry.id)
      entry.nestingMachine.depthCommitted(newDepth)

      currentId = entry.parentId
    }
  }

  /**
   * Compute the nesting depth for a node: the length of the longest
   * chain of open descendants.
   */
  #computeNestingDepth(id: DrawerId): number {
    let depth = 0
    let currentId: DrawerId = id

    // Follow the chain of nesting-active children downward
    while (true) {
      let openChild: DrawerNodeEntry | null = null
      for (const entry of this.#entries.values()) {
        if (
          entry.parentId === currentId &&
          isNestingActivePhase(entry.machine.snapshot.phase)
        ) {
          openChild = entry
          break // one open child at a time
        }
      }
      if (!openChild) break
      depth++
      currentId = openChild.id
    }

    return depth
  }

  #getFrontmostOpen(): DrawerNodeEntry | undefined {
    let frontmost: DrawerNodeEntry | undefined
    let maxDepth = -1
    for (const entry of this.#entries.values()) {
      if (isOpenPhase(entry.machine.snapshot.phase)) {
        const depth = this.#computeDepth(entry.id)
        if (depth > maxDepth) {
          maxDepth = depth
          frontmost = entry
        }
      }
    }
    return frontmost
  }

  #toView(entry: DrawerNodeEntry): DrawerNodeView {
    return {
      id: entry.id,
      parentId: entry.parentId,
      depth: this.#computeDepth(entry.id),
      phase: entry.machine.snapshot.phase,
      nesting: entry.nestingMachine.snapshot,
    }
  }

  #computeDepth(id: DrawerId): number {
    let depth = 0
    let current = this.#entries.get(id)
    while (current?.parentId != null) {
      depth++
      current = this.#entries.get(current.parentId)
    }
    return depth
  }
}

/**
 * Whether a phase contributes to nesting depth.
 * Excludes `Closed` and `Closing` — once a child begins closing,
 * the parent should start scaling back up (for parallel animation).
 */
function isNestingActivePhase(phase: Phase): boolean {
  return phase !== Phase.Closed && phase !== Phase.Closing
}
