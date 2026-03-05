import type { DrawerMachine } from '../drawer/machine'
import { Phase, isOpenPhase } from '../drawer/phase'
import { NestingMachine, type NestingTransitionHandle } from './machine'
import { type NestingState, NestingPhase, getNestingDepth } from './reducer'

// Re-export nesting types for consumers
export {
  NestingPhase,
  type NestingState,
  type NestingTransitionHandle,
  getNestingDepth,
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Whether a phase contributes to nesting depth.
 * Excludes `Closed` and `Closing` — once a child begins closing,
 * the parent should start scaling back up (parallel animation).
 */
function isNestingActivePhase(phase: Phase): boolean {
  return phase !== Phase.Closed && phase !== Phase.Closing
}

// ── Types ────────────────────────────────────────────────────

export type DrawerId = string

export interface DrawerRegistration {
  id: DrawerId
  parentId: DrawerId | null
  machine: DrawerMachine
}

/**
 * Internal entry stored in the flat map.
 * Corresponds to the article's "FlatNode" concept — a parentId-based flat model
 * rather than a recursive tree structure.
 */
interface DrawerNodeEntry {
  readonly id: DrawerId
  readonly parentId: DrawerId | null
  readonly machine: DrawerMachine
}

/**
 * Read-only view of a drawer node exposed to consumers.
 * Enriched with computed `depth` and live `phase` from the machine snapshot,
 * plus nesting state derived from the drawer tree.
 */
export interface DrawerNodeView {
  readonly id: DrawerId
  readonly parentId: DrawerId | null
  readonly depth: number
  readonly phase: Phase
  /** Nesting state (discriminated union keyed by NestingPhase). */
  readonly nesting: NestingState
}

// ── Registry ──────────────────────────────────────────────────

type ChangeListener = () => void

const DEFAULT_NESTING_STATE: NestingState = { phase: NestingPhase.Inactive }

/** @internal */
export class DrawerRegistry {
  /**
   * Flat map of all registered drawer nodes.
   * This is the "one-dimensional data structure" described in the reference article —
   * we store `parentId` on each entry rather than using a recursive tree type,
   * making traversal and lookup O(1) by id and O(n) for scans.
   */
  #entries = new Map<DrawerId, DrawerNodeEntry>()

  /**
   * Cleanup functions for machine.subscribePhaseChange per drawer.
   */
  #phaseUnsubscribers = new Map<DrawerId, () => void>()

  /**
   * Generic change listeners notified on any structural or phase change.
   * Designed for useSyncExternalStore integration.
   */
  #listeners = new Set<ChangeListener>()

  /**
   * Nesting state machine per drawer node.
   * Owns committed depth, target depth, nesting phase, and generation tracking.
   */
  #nestingMachines = new Map<DrawerId, NestingMachine>()

  // ── Lifecycle ────────────────────────────────────────────

  /**
   * Register a drawer node in the manager.
   * Returns an unregister function for cleanup.
   */
  register(registration: DrawerRegistration): () => void {
    const { id, parentId, machine } = registration

    if (__DEV__) {
      if (this.#entries.has(id)) {
        console.warn(
          `[DrawerRegistry] Drawer "${id}" is already registered. Skipping duplicate registration.`,
        )
        return () => {}
      }
      if (parentId && !this.#entries.has(parentId)) {
        console.warn(
          `[DrawerRegistry] Parent drawer "${parentId}" is not registered. Drawer "${id}" will be treated as a root until the parent is registered.`,
        )
      }
    }

    const entry: DrawerNodeEntry = { id, parentId, machine }
    this.#entries.set(id, entry)

    // Initialize nesting machine — compute depth immediately in case open
    // descendants were registered before this node.
    const initialDepth = this.#computeNestingDepth(id)
    this.#nestingMachines.set(id, new NestingMachine(initialDepth))

    // Subscribe to the machine's phase changes so the manager snapshot stays fresh
    // and nesting state for ancestors is updated reactively.
    const unsubPhase = machine.subscribePhaseChange(() => {
      this.#onPhaseChange(id)
    })
    this.#phaseUnsubscribers.set(id, unsubPhase)

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
    const unsub = this.#phaseUnsubscribers.get(id)
    if (unsub) {
      unsub()
      this.#phaseUnsubscribers.delete(id)
    }

    this.#nestingMachines.delete(id)
    this.#entries.delete(id)

    // Recalculate nesting depth for ancestors — removing a node may reduce
    // the number of open descendants above an ancestor.
    if (entry?.parentId != null) {
      this.#updateAncestorNestingDepths(entry.parentId)
    }

    this.#invalidate()
  }

  // ── Tree queries ─────────────────────────────────────────

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

  // ── State queries ────────────────────────────────────────

  isFrontmost(id: DrawerId): boolean {
    return this.#getFrontmostOpen()?.id === id
  }

  // ── Subscribe ─────────────────────────────────────────────

  /**
   * Subscribe to any change in the manager (registration, unregistration, or phase change).
   * Follows the same contract as DrawerMachine.subscribePhaseChange.
   */
  subscribe = (listener: ChangeListener): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  // ── Nesting ──────────────────────────────────────────────

  /**
   * Get the nesting state for a specific drawer node.
   */
  getNestingState(id: DrawerId): NestingState {
    return this.#nestingMachines.get(id)?.snapshot ?? DEFAULT_NESTING_STATE
  }

  /**
   * Register interest in a nesting transition for a drawer.
   * Returns a handle to report animation completion, or `null` if no
   * animation is needed.
   *
   * Works for all animating nesting phases:
   * - `Scaling`: scale depth transition (child open/close)
   * - `DragRestoring`: scale returning to committed depth after drag cancel
   *
   * The React layer calls this when it detects a nesting phase change
   * that requires animation.
   */
  registerNestingTransition(id: DrawerId): NestingTransitionHandle | null {
    const machine = this.#nestingMachines.get(id)
    if (!machine) return null

    const handle = machine.registerTransition()
    if (!handle) return null

    // Wrap reportComplete to notify listeners when the animation finishes
    // (since this is called from React, not from the registry's own
    // orchestration flow).
    return {
      reportComplete: () => {
        handle.reportComplete()
        this.#invalidate()
      },
      reportCancel: () => {
        handle.reportCancel()
      },
    }
  }

  // ── Internals ────────────────────────────────────────────

  #invalidate(): void {
    for (const listener of this.#listeners) {
      listener()
    }
  }

  /**
   * Called when a registered machine's phase changes.
   * Updates nesting depth and nesting phase for all ancestors reactively.
   */
  #onPhaseChange(id: DrawerId): void {
    const entry = this.#entries.get(id)
    if (!entry) return

    const childPhase = entry.machine.snapshot.phase

    // When a drawer starts closing, propagate close to all direct open children.
    // Each child's own #onPhaseChange will recurse to grandchildren automatically.
    if (childPhase === Phase.Closing) {
      for (const other of this.#entries.values()) {
        if (
          other.parentId === id &&
          isOpenPhase(other.machine.snapshot.phase)
        ) {
          other.machine.requestClose()
        }
      }
    }

    if (__DEV__) {
      // Warn if a sibling is already open (one open child at a time constraint)
      if (entry.parentId != null) {
        if (childPhase === Phase.Opening) {
          for (const other of this.#entries.values()) {
            if (
              other.parentId === entry.parentId &&
              other.id !== id &&
              isOpenPhase(other.machine.snapshot.phase)
            ) {
              console.warn(
                `[DrawerRegistry] Drawer "${id}" is opening while sibling "${other.id}" is already open. ` +
                  `Only one child drawer should be open at a time.`,
              )
              break
            }
          }
        }
      }
    }

    // Update ancestor nesting phases based on child's drag lifecycle
    if (entry.parentId != null) {
      if (childPhase === Phase.Dragging) {
        this.#enterAncestorDragControlled(entry.parentId)
      } else if (childPhase === Phase.Settling) {
        this.#restoreAncestorsFromDrag(entry.parentId)
      }
    }

    // Update nesting depths for all ancestors of the changed node.
    // This also sets Scaling phase when target depth changes.
    if (entry.parentId != null) {
      this.#updateAncestorNestingDepths(entry.parentId)
    }

    this.#invalidate()
  }

  /**
   * Set ancestors to DragControlled phase.
   */
  #enterAncestorDragControlled(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      this.#nestingMachines.get(currentId)?.enterDragControlled()

      currentId = entry.parentId
    }
  }

  /**
   * Transition ancestors from DragControlled to DragRestoring.
   * Only transitions ancestors that are currently in DragControlled phase.
   */
  #restoreAncestorsFromDrag(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      this.#nestingMachines.get(currentId)?.restoreFromDrag()

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

      const newTarget = this.#computeNestingDepth(currentId)
      this.#nestingMachines.get(currentId)?.depthChanged(newTarget)

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

      const newDepth = this.#computeNestingDepth(currentId)
      this.#nestingMachines.get(currentId)?.depthCommitted(newDepth)

      currentId = entry.parentId
    }
  }

  /**
   * Compute the nesting depth for a node: the length of the longest
   * chain of open descendants.
   *
   * Under the "one open child at a time" constraint, this is effectively
   * a linear chain traversal (O(depth)).
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

  /**
   * Returns the deepest currently-open drawer.
   */
  #getFrontmostOpen(): DrawerNodeView | undefined {
    let frontmost: DrawerNodeView | undefined
    let maxDepth = -1
    for (const entry of this.#entries.values()) {
      if (isOpenPhase(entry.machine.snapshot.phase)) {
        const depth = this.#computeDepth(entry.id)
        if (depth > maxDepth) {
          maxDepth = depth
          frontmost = this.#toView(entry)
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
      nesting:
        this.#nestingMachines.get(entry.id)?.snapshot ?? DEFAULT_NESTING_STATE,
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
