import type { DrawerMachine } from './drawer-machine'
import { type Phase, isOpenPhase } from './reducer'

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
 * Enriched with computed `depth` and live `phase` from the machine snapshot.
 */
export interface DrawerNodeView {
  readonly id: DrawerId
  readonly parentId: DrawerId | null
  readonly depth: number
  readonly phase: Phase
}

// ── Registry ──────────────────────────────────────────────────

type ChangeListener = () => void

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
      if (parentId !== null && !this.#entries.has(parentId)) {
        console.warn(
          `[DrawerRegistry] Parent drawer "${parentId}" is not registered. Drawer "${id}" will be treated as a root until the parent is registered.`,
        )
      }
    }

    const entry: DrawerNodeEntry = { id, parentId, machine }
    this.#entries.set(id, entry)

    // Subscribe to the machine's phase changes so the manager snapshot stays fresh
    const unsubPhase = machine.subscribePhaseChange(() => {
      this.#invalidate()
    })
    this.#phaseUnsubscribers.set(id, unsubPhase)

    this.#invalidate()

    return () => this.#unregister(id)
  }

  #unregister(id: DrawerId): void {
    const unsub = this.#phaseUnsubscribers.get(id)
    if (unsub) {
      unsub()
      this.#phaseUnsubscribers.delete(id)
    }

    this.#entries.delete(id)
    this.#invalidate()
  }

  // ── Tree queries ─────────────────────────────────────────

  getNode(id: DrawerId): DrawerNodeView | undefined {
    const entry = this.#entries.get(id)
    if (!entry) return undefined
    return this.#toView(entry)
  }

  getDepth(id: DrawerId): number {
    let depth = 0
    let current = this.#entries.get(id)
    while (current?.parentId != null) {
      depth++
      current = this.#entries.get(current.parentId)
    }
    return depth
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
        const depth = this.getDepth(entry.id)
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

  // ── Flat list (article's toFlat()) ───────────────────────

  /**
   * Returns all nodes in depth-first order, mirroring the article's `toFlat()` approach:
   * "木構造を、一度深さ情報と親idを付与したデータに変換する"
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

  // ── Internals ────────────────────────────────────────────

  #invalidate(): void {
    this.#cachedSnapshot = null
    for (const listener of this.#listeners) {
      listener()
    }
  }

  #toView(entry: DrawerNodeEntry): DrawerNodeView {
    return {
      id: entry.id,
      parentId: entry.parentId,
      depth: this.getDepth(entry.id),
      phase: entry.machine.snapshot.phase,
    }
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
    result.push({
      id: entry.id,
      parentId: entry.parentId,
      depth,
      phase: entry.machine.snapshot.phase,
    })
    for (const child of this.#entries.values()) {
      if (child.parentId === entry.id) {
        this.#walkDepthFirst(child, depth + 1, result)
      }
    }
  }

  #collectDescendants(id: DrawerId, result: DrawerNodeView[]): void {
    for (const entry of this.#entries.values()) {
      if (entry.parentId === id) {
        result.push(this.#toView(entry))
        this.#collectDescendants(entry.id, result)
      }
    }
  }
}
