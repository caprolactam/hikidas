import type { DrawerMachine } from './drawer-machine'
import { Phase, isOpenPhase } from './reducer'

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
 * Nesting state for a drawer node.
 *
 * `nestingDepth` — the current (committed) depth of open descendants stacked above.
 *   0 means the drawer is in the foreground (no open descendants).
 *
 * `targetNestingDepth` — the depth the drawer is animating toward.
 *   When `nestingDepth !== targetNestingDepth`, a scale transition animation
 *   should be in progress.
 */
export interface NestingState {
  readonly nestingDepth: number
  readonly targetNestingDepth: number
}

/** Handle returned by `registerNestingTransition` for animation completion reporting. */
export interface NestingTransitionHandle {
  /** Call when the scale animation has finished. */
  reportComplete: () => void
  /** Call when the animation is cancelled (e.g. unmount). */
  reportCancel: () => void
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
  /** Current committed nesting depth (0 = foreground). */
  readonly nestingDepth: number
  /** Target nesting depth the drawer is animating toward. */
  readonly targetNestingDepth: number
}

// ── Registry ──────────────────────────────────────────────────

type ChangeListener = () => void

const DEFAULT_NESTING_STATE: NestingState = {
  nestingDepth: 0,
  targetNestingDepth: 0,
}

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
   * Nesting state per drawer node.
   * Tracks both the committed depth and the target depth for animation.
   */
  #nestingStates = new Map<DrawerId, NestingState>()

  /**
   * Generation symbol per drawer for nesting transitions.
   * When targetNestingDepth changes again mid-animation, a new generation
   * is created and older handles become stale.
   */
  #nestingGenerations = new Map<DrawerId, symbol>()

  /**
   * Cached snapshot for useSyncExternalStore.
   * Invalidated (set to null) on any change; lazily rebuilt in getSnapshot().
   */
  #cachedSnapshot: DrawerNodeView[] | null = null

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

    // Initialize nesting state — compute immediately in case open descendants
    // were registered before this node.
    const initialDepth = this.#computeNestingDepth(id)
    this.#nestingStates.set(id, {
      nestingDepth: initialDepth,
      targetNestingDepth: initialDepth,
    })

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

    this.#nestingStates.delete(id)
    this.#nestingGenerations.delete(id)
    this.#entries.delete(id)

    // Recalculate nesting depth for ancestors — removing a node may reduce
    // the number of open descendants above an ancestor.
    if (entry?.parentId != null) {
      this.#updateAncestorNestingDepths(entry.parentId)
    }

    this.#invalidate()
  }

  // ── Tree queries ─────────────────────────────────────────

  getNode(id: DrawerId): DrawerNodeView | undefined {
    const entry = this.#entries.get(id)
    if (!entry) return undefined
    return this.#toView(entry)
  }

  getChildren(id: DrawerId): DrawerNodeView[] {
    const children: DrawerNodeView[] = []
    for (const entry of this.#entries.values()) {
      if (entry.parentId === id) {
        children.push(this.#toView(entry))
      }
    }
    return children
  }

  getDescendants(id: DrawerId): DrawerNodeView[] {
    const descendants: DrawerNodeView[] = []
    this.#collectDescendants(id, descendants)
    return descendants
  }

  #collectDescendants(id: DrawerId, result: DrawerNodeView[]): void {
    for (const entry of this.#entries.values()) {
      if (entry.parentId === id) {
        result.push(this.#toView(entry))
        this.#collectDescendants(entry.id, result)
      }
    }
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

  getSiblings(id: DrawerId): DrawerNodeView[] {
    const entry = this.#entries.get(id)
    if (!entry) return []
    const siblings: DrawerNodeView[] = []
    for (const other of this.#entries.values()) {
      if (other.parentId === entry.parentId && other.id !== id) {
        siblings.push(this.#toView(other))
      }
    }
    return siblings
  }

  getRoots(): DrawerNodeView[] {
    const roots: DrawerNodeView[] = []
    for (const entry of this.#entries.values()) {
      if (entry.parentId === null) {
        roots.push(this.#toView(entry))
      }
    }
    return roots
  }

  // ── State queries ────────────────────────────────────────

  getOpenNodes(): DrawerNodeView[] {
    const open: DrawerNodeView[] = []
    for (const entry of this.#entries.values()) {
      if (isOpenPhase(entry.machine.snapshot.phase)) {
        open.push(this.#toView(entry))
      }
    }
    return open
  }

  /**
   * Returns the deepest currently-open drawer.
   * Useful for determining which drawer should receive drag gestures.
   */
  getFrontmostOpen(): DrawerNodeView | undefined {
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

  isFrontmost(id: DrawerId): boolean {
    return this.getFrontmostOpen()?.id === id
  }

  getMachine(id: DrawerId): DrawerMachine | undefined {
    return this.#entries.get(id)?.machine
  }

  get size(): number {
    return this.#entries.size
  }

  // ── Flat list  ───────────────────────

  /**
   * Returns all nodes in depth-first order
   */
  toFlat(): DrawerNodeView[] {
    const result: DrawerNodeView[] = []
    const roots = this.#getRootEntries()
    for (const root of roots) {
      this.#walkDepthFirst(root, 0, result)
    }
    return result
  }

  // ── Subscribe / Snapshot (useSyncExternalStore compatible) ─

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

  /**
   * Get a stable snapshot of all nodes in depth-first order.
   * The snapshot is cached and only rebuilt when invalidated.
   * Designed for useSyncExternalStore(manager.subscribe, manager.getSnapshot).
   */
  getSnapshot = (): DrawerNodeView[] => {
    if (this.#cachedSnapshot === null) {
      this.#cachedSnapshot = this.toFlat()
    }
    return this.#cachedSnapshot
  }

  // ── Nesting ──────────────────────────────────────────────

  /**
   * Get the nesting state for a specific drawer node.
   */
  getNestingState(id: DrawerId): NestingState {
    return this.#nestingStates.get(id) ?? DEFAULT_NESTING_STATE
  }

  /**
   * Register interest in a nesting depth transition for a drawer.
   * Returns a handle to report animation completion, or `null` if no
   * animation is needed (depth already matches target).
   *
   * The React layer calls this when it detects a targetNestingDepth change
   * and starts a scale animation.
   */
  registerNestingTransition(id: DrawerId): NestingTransitionHandle | null {
    const state = this.#nestingStates.get(id)
    if (!state || state.nestingDepth === state.targetNestingDepth) {
      return null
    }

    // Create a new generation for this transition
    const generation = Symbol()
    this.#nestingGenerations.set(id, generation)

    return {
      reportComplete: () => {
        // Only commit if the generation still matches (no newer target arrived)
        if (this.#nestingGenerations.get(id) !== generation) return
        const current = this.#nestingStates.get(id)
        if (!current) return

        this.#nestingStates.set(id, {
          nestingDepth: current.targetNestingDepth,
          targetNestingDepth: current.targetNestingDepth,
        })
        this.#nestingGenerations.delete(id)
        this.#invalidate()
      },
      reportCancel: () => {
        // Just remove the generation — leave state as-is
        if (this.#nestingGenerations.get(id) === generation) {
          this.#nestingGenerations.delete(id)
        }
      },
    }
  }

  // ── Internals ────────────────────────────────────────────

  #invalidate(): void {
    this.#cachedSnapshot = null
    for (const listener of this.#listeners) {
      listener()
    }
  }

  /**
   * Called when a registered machine's phase changes.
   * Updates nesting depth for all ancestors reactively.
   */
  #onPhaseChange(id: DrawerId): void {
    const entry = this.#entries.get(id)

    // When a drawer starts closing, propagate close to all direct open children.
    // Each child's own #onPhaseChange will recurse to grandchildren automatically.
    if (entry && entry.machine.snapshot.phase === Phase.Closing) {
      for (const other of this.#entries.values()) {
        if (other.parentId === id && isOpenPhase(other.machine.snapshot.phase)) {
          other.machine.requestClose()
        }
      }
    }

    if (__DEV__) {
      // Warn if a sibling is already open (one open child at a time constraint)
      if (entry?.parentId != null) {
        const phase = entry.machine.snapshot.phase
        if (phase === Phase.Opening) {
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

    // Update nesting depths for all ancestors of the changed node
    if (entry?.parentId != null) {
      this.#updateAncestorNestingDepths(entry.parentId)
    }

    this.#invalidate()
  }

  /**
   * Recalculate targetNestingDepth for a node and all its ancestors.
   */
  #updateAncestorNestingDepths(startId: DrawerId): void {
    let currentId: DrawerId | null = startId
    while (currentId != null) {
      const entry = this.#entries.get(currentId)
      if (!entry) break

      const newTarget = this.#computeNestingDepth(currentId)
      const state = this.#nestingStates.get(currentId)
      const currentTarget = state?.targetNestingDepth ?? 0

      if (newTarget !== currentTarget) {
        const currentDepth = state?.nestingDepth ?? 0
        if (newTarget === currentDepth) {
          // No animation needed — just commit directly
          this.#nestingStates.set(currentId, {
            nestingDepth: newTarget,
            targetNestingDepth: newTarget,
          })
          this.#nestingGenerations.delete(currentId)
        } else {
          // Animation needed — update target, new generation
          this.#nestingStates.set(currentId, {
            nestingDepth: currentDepth,
            targetNestingDepth: newTarget,
          })
          this.#nestingGenerations.set(currentId, Symbol())
        }
      }

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
      this.#nestingStates.set(currentId, {
        nestingDepth: newDepth,
        targetNestingDepth: newDepth,
      })
      this.#nestingGenerations.delete(currentId)

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

  #toView(entry: DrawerNodeEntry): DrawerNodeView {
    const nesting = this.#nestingStates.get(entry.id) ?? DEFAULT_NESTING_STATE
    return {
      id: entry.id,
      parentId: entry.parentId,
      depth: this.#computeDepth(entry.id),
      phase: entry.machine.snapshot.phase,
      nestingDepth: nesting.nestingDepth,
      targetNestingDepth: nesting.targetNestingDepth,
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

  #getRootEntries(): DrawerNodeEntry[] {
    const roots: DrawerNodeEntry[] = []
    for (const entry of this.#entries.values()) {
      if (entry.parentId === null) {
        roots.push(entry)
      }
    }
    return roots
  }

  #walkDepthFirst(
    entry: DrawerNodeEntry,
    depth: number,
    result: DrawerNodeView[],
  ): void {
    const nesting = this.#nestingStates.get(entry.id) ?? DEFAULT_NESTING_STATE
    result.push({
      id: entry.id,
      parentId: entry.parentId,
      depth,
      phase: entry.machine.snapshot.phase,
      nestingDepth: nesting.nestingDepth,
      targetNestingDepth: nesting.targetNestingDepth,
    })
    for (const child of this.#entries.values()) {
      if (child.parentId === entry.id) {
        this.#walkDepthFirst(child, depth + 1, result)
      }
    }
  }
}
