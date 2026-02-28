import { describe, expect, test, vi, beforeEach, assert } from 'vitest'
import { DrawerMachine } from './drawer-machine'
import { DrawerRegistry } from './drawer-registry'
import { Phase } from './reducer'

/**
 * Creates a DrawerMachine with sensible defaults for testing.
 */
function createMachine(initialOpen = false): DrawerMachine {
  return new DrawerMachine(
    initialOpen,
    { snapPoints: undefined, snapPointIndex: undefined },
    { dismissalDirection: 'down', disableDragDismiss: false },
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('DrawerRegistry', () => {
  // ── Registration lifecycle ─────────────────────────────

  describe('register / unregister', () => {
    test('registers a root node and retrieves it', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      manager.register({ id: 'a', parentId: null, machine })

      const node = manager.getNode('a')
      assert(node)
      expect(node.id).toBe('a')
      expect(node.parentId).toBeNull()
      expect(node.depth).toBe(0)
    })

    test('unregister removes the node', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      const unregister = manager.register({
        id: 'a',
        parentId: null,
        machine,
      })
      expect(manager.size).toBe(1)

      unregister()
      expect(manager.size).toBe(0)
      expect(manager.getNode('a')).toBeUndefined()
    })

    test('unregister is idempotent', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      const unregister = manager.register({
        id: 'a',
        parentId: null,
        machine,
      })

      unregister()
      expect(() => unregister()).not.toThrow()
      expect(manager.size).toBe(0)
    })

    test('size reflects the number of registered nodes', () => {
      const manager = new DrawerRegistry()

      const u1 = manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(),
      })
      const u2 = manager.register({
        id: 'b',
        parentId: null,
        machine: createMachine(),
      })
      expect(manager.size).toBe(2)

      u1()
      expect(manager.size).toBe(1)

      u2()
      expect(manager.size).toBe(0)
    })
  })

  // ── Tree queries ───────────────────────────────────────

  describe('tree queries', () => {
    /**
     * Build a three-level tree for testing:
     *
     *   root
     *   ├── child1
     *   │   └── grandchild
     *   └── child2
     */
    function buildTree() {
      const manager = new DrawerRegistry()
      const machines = {
        root: createMachine(),
        child1: createMachine(),
        child2: createMachine(),
        grandchild: createMachine(),
      }

      manager.register({ id: 'root', parentId: null, machine: machines.root })
      manager.register({
        id: 'child1',
        parentId: 'root',
        machine: machines.child1,
      })
      manager.register({
        id: 'child2',
        parentId: 'root',
        machine: machines.child2,
      })
      manager.register({
        id: 'grandchild',
        parentId: 'child1',
        machine: machines.grandchild,
      })

      return { manager, machines }
    }

    test('depth is correct for each level', () => {
      const { manager } = buildTree()

      expect(manager.getNode('root')?.depth).toBe(0)
      expect(manager.getNode('child1')?.depth).toBe(1)
      expect(manager.getNode('child2')?.depth).toBe(1)
      expect(manager.getNode('grandchild')?.depth).toBe(2)
    })

    test('getChildren returns direct children only', () => {
      const { manager } = buildTree()

      const children = manager.getChildren('root')
      const ids = children.map((n) => n.id).sort()
      expect(ids).toEqual(['child1', 'child2'])
    })

    test('getChildren returns empty array for leaf nodes', () => {
      const { manager } = buildTree()

      expect(manager.getChildren('grandchild')).toEqual([])
    })

    test('getDescendants returns all descendants recursively', () => {
      const { manager } = buildTree()

      const descendants = manager.getDescendants('root')
      const ids = descendants.map((n) => n.id).sort()
      expect(ids).toEqual(['child1', 'child2', 'grandchild'])
    })

    test('getDescendants of child1 returns only grandchild', () => {
      const { manager } = buildTree()

      const descendants = manager.getDescendants('child1')
      expect(descendants).toHaveLength(1)
      expect(descendants[0]!.id).toBe('grandchild')
    })

    test('getAncestors returns ancestors from immediate parent to root', () => {
      const { manager } = buildTree()

      const ancestors = manager.getAncestors('grandchild')
      const ids = ancestors.map((n) => n.id)
      expect(ids).toEqual(['child1', 'root'])
    })

    test('getAncestors of root returns empty array', () => {
      const { manager } = buildTree()

      expect(manager.getAncestors('root')).toEqual([])
    })

    test('getSiblings returns nodes with same parentId', () => {
      const { manager } = buildTree()

      const siblings = manager.getSiblings('child1')
      expect(siblings).toHaveLength(1)
      expect(siblings[0]!.id).toBe('child2')
    })

    test('getSiblings of a lone child returns empty array', () => {
      const { manager } = buildTree()

      expect(manager.getSiblings('grandchild')).toEqual([])
    })

    test('getRoots returns only root nodes', () => {
      const { manager } = buildTree()

      const roots = manager.getRoots()
      expect(roots).toHaveLength(1)
      expect(roots[0]!.id).toBe('root')
    })

    test('getRoots with multiple roots', () => {
      const manager = new DrawerRegistry()
      manager.register({
        id: 'r1',
        parentId: null,
        machine: createMachine(),
      })
      manager.register({
        id: 'r2',
        parentId: null,
        machine: createMachine(),
      })

      const roots = manager.getRoots()
      const ids = roots.map((n) => n.id).sort()
      expect(ids).toEqual(['r1', 'r2'])
    })
  })

  // ── State queries ──────────────────────────────────────

  describe('state queries', () => {
    test('getOpenNodes returns only open drawers', () => {
      const manager = new DrawerRegistry()
      const openMachine = createMachine(true) // starts in Idle
      const closedMachine = createMachine(false) // starts in Closed

      manager.register({ id: 'open', parentId: null, machine: openMachine })
      manager.register({
        id: 'closed',
        parentId: null,
        machine: closedMachine,
      })

      const openNodes = manager.getOpenNodes()
      expect(openNodes).toHaveLength(1)
      expect(openNodes[0]!.id).toBe('open')
    })

    test('getFrontmostOpen returns the deepest open drawer', () => {
      const manager = new DrawerRegistry()

      manager.register({
        id: 'root',
        parentId: null,
        machine: createMachine(true),
      })
      manager.register({
        id: 'child',
        parentId: 'root',
        machine: createMachine(true),
      })
      manager.register({
        id: 'grandchild',
        parentId: 'child',
        machine: createMachine(false), // closed
      })

      const front = manager.getFrontmostOpen()
      expect(front).toBeDefined()
      expect(front!.id).toBe('child')
      expect(front!.depth).toBe(1)
    })

    test('getFrontmostOpen returns undefined when no drawers are open', () => {
      const manager = new DrawerRegistry()
      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(false),
      })

      expect(manager.getFrontmostOpen()).toBeUndefined()
    })

    test('isFrontmost correctly identifies the frontmost drawer', () => {
      const manager = new DrawerRegistry()

      manager.register({
        id: 'parent',
        parentId: null,
        machine: createMachine(true),
      })
      manager.register({
        id: 'child',
        parentId: 'parent',
        machine: createMachine(true),
      })

      expect(manager.isFrontmost('child')).toBe(true)
      expect(manager.isFrontmost('parent')).toBe(false)
    })

    test('getMachine returns the DrawerMachine for a registered id', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      manager.register({ id: 'a', parentId: null, machine })

      expect(manager.getMachine('a')).toBe(machine)
    })

    test('getMachine returns undefined for unregistered id', () => {
      const manager = new DrawerRegistry()

      expect(manager.getMachine('nonexistent')).toBeUndefined()
    })
  })

  // ── toFlat ─────────────────────────────────────────────

  describe('toFlat', () => {
    test('returns nodes in depth-first order with correct depths', () => {
      const manager = new DrawerRegistry()

      manager.register({
        id: 'root',
        parentId: null,
        machine: createMachine(),
      })
      manager.register({
        id: 'child1',
        parentId: 'root',
        machine: createMachine(),
      })
      manager.register({
        id: 'grandchild',
        parentId: 'child1',
        machine: createMachine(),
      })
      manager.register({
        id: 'child2',
        parentId: 'root',
        machine: createMachine(),
      })

      const flat = manager.toFlat()
      const result = flat.map((n) => ({ id: n.id, depth: n.depth }))

      expect(result).toEqual([
        { id: 'root', depth: 0 },
        { id: 'child1', depth: 1 },
        { id: 'grandchild', depth: 2 },
        { id: 'child2', depth: 1 },
      ])
    })

    test('returns empty array when no nodes are registered', () => {
      const manager = new DrawerRegistry()

      expect(manager.toFlat()).toEqual([])
    })

    test('multiple roots appear in order', () => {
      const manager = new DrawerRegistry()

      manager.register({
        id: 'r1',
        parentId: null,
        machine: createMachine(),
      })
      manager.register({
        id: 'r2',
        parentId: null,
        machine: createMachine(),
      })

      const flat = manager.toFlat()
      expect(flat).toHaveLength(2)
      expect(flat[0]!.depth).toBe(0)
      expect(flat[1]!.depth).toBe(0)
    })
  })

  // ── Subscribe / Snapshot ───────────────────────────────

  describe('subscribe and getSnapshot', () => {
    test('subscribe listener is called on register', () => {
      const manager = new DrawerRegistry()
      const listener = vi.fn()

      manager.subscribe(listener)

      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(),
      })

      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('subscribe listener is called on unregister', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()
      const unregister = manager.register({
        id: 'a',
        parentId: null,
        machine,
      })

      const listener = vi.fn()
      manager.subscribe(listener)

      unregister()
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('subscribe listener is called on machine phase change', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine(false)

      manager.register({ id: 'a', parentId: null, machine })

      const listener = vi.fn()
      manager.subscribe(listener)

      // Trigger a phase change: Closed -> Opening
      machine.requestOpen()

      expect(listener).toHaveBeenCalled()
    })

    test('unsubscribe stops listener from being called', () => {
      const manager = new DrawerRegistry()
      const listener = vi.fn()

      const unsub = manager.subscribe(listener)
      unsub()

      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(),
      })

      expect(listener).not.toHaveBeenCalled()
    })

    test('getSnapshot returns cached reference if nothing changed', () => {
      const manager = new DrawerRegistry()
      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(),
      })

      const snap1 = manager.getSnapshot()
      const snap2 = manager.getSnapshot()
      expect(snap1).toBe(snap2) // same reference
    })

    test('getSnapshot returns a new reference after a change', () => {
      const manager = new DrawerRegistry()
      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(),
      })

      const snap1 = manager.getSnapshot()

      manager.register({
        id: 'b',
        parentId: null,
        machine: createMachine(),
      })

      const snap2 = manager.getSnapshot()
      expect(snap1).not.toBe(snap2)
    })

    test('getSnapshot reflects phase changes from machines', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine(false) // Closed

      manager.register({ id: 'a', parentId: null, machine })

      const snap1 = manager.getSnapshot()
      expect(snap1[0]!.phase).toBe(Phase.Closed)

      machine.requestOpen() // Closed -> Opening

      const snap2 = manager.getSnapshot()
      expect(snap2[0]!.phase).toBe(Phase.Opening)
    })
  })

  // ── Edge cases ─────────────────────────────────────────

  describe('edge cases', () => {
    test('child survives parent unregister and becomes a root-like orphan', () => {
      const manager = new DrawerRegistry()

      const unregParent = manager.register({
        id: 'parent',
        parentId: null,
        machine: createMachine(),
      })
      manager.register({
        id: 'child',
        parentId: 'parent',
        machine: createMachine(),
      })

      expect(manager.getNode('child')?.depth).toBe(1)

      unregParent()

      // Child still exists but parentId points to a non-existent node
      const child = manager.getNode('child')
      expect(child).toBeDefined()
      expect(child!.parentId).toBe('parent')
      // parentId is non-null but the parent entry doesn't exist, so depth
      // counts the one hop to the missing parent before stopping → depth = 1
      expect(manager.getNode('child')?.depth).toBe(1)
    })

    test('getNode returns undefined for non-existent id', () => {
      const manager = new DrawerRegistry()
      expect(manager.getNode('nonexistent')).toBeUndefined()
    })

    test('depth is undefined for non-existent id', () => {
      const manager = new DrawerRegistry()
      expect(manager.getNode('nonexistent')?.depth).toBeUndefined()
    })

    test('phase unsubscription on unregister prevents stale notifications', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine(false)

      const unregister = manager.register({
        id: 'a',
        parentId: null,
        machine,
      })

      const listener = vi.fn()
      manager.subscribe(listener)

      unregister()
      listener.mockClear()

      // Phase change after unregister should NOT trigger the manager listener
      machine.requestOpen()
      expect(listener).not.toHaveBeenCalled()
    })
  })

  // ── Nesting state ──────────────────────────────────────

  describe('nesting state', () => {
    /**
     * Build a two-level tree: root > child.
     * Both start closed.
     */
    function buildNestingPair() {
      const manager = new DrawerRegistry()
      const machines = {
        root: createMachine(true), // root starts open (Idle)
        child: createMachine(false), // child starts closed
      }

      manager.register({
        id: 'root',
        parentId: null,
        machine: machines.root,
      })
      manager.register({
        id: 'child',
        parentId: 'root',
        machine: machines.child,
      })

      return { manager, machines }
    }

    /**
     * Build a three-level tree: root > child > grandchild.
     */
    function buildNestingChain() {
      const manager = new DrawerRegistry()
      const machines = {
        root: createMachine(true),
        child: createMachine(false),
        grandchild: createMachine(false),
      }

      manager.register({
        id: 'root',
        parentId: null,
        machine: machines.root,
      })
      manager.register({
        id: 'child',
        parentId: 'root',
        machine: machines.child,
      })
      manager.register({
        id: 'grandchild',
        parentId: 'child',
        machine: machines.grandchild,
      })

      return { manager, machines }
    }

    test('initial nesting state is foreground (depth 0)', () => {
      const { manager } = buildNestingPair()

      const rootState = manager.getNestingState('root')
      expect(rootState.nestingDepth).toBe(0)
      expect(rootState.targetNestingDepth).toBe(0)

      const childState = manager.getNestingState('child')
      expect(childState.nestingDepth).toBe(0)
      expect(childState.targetNestingDepth).toBe(0)
    })

    test('child opening sets targetNestingDepth on parent', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen() // Closed -> Opening

      const rootState = manager.getNestingState('root')
      expect(rootState.nestingDepth).toBe(0) // not yet committed
      expect(rootState.targetNestingDepth).toBe(1)
    })

    test('child node itself remains at nesting depth 0', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const childState = manager.getNestingState('child')
      expect(childState.nestingDepth).toBe(0)
      expect(childState.targetNestingDepth).toBe(0)
    })

    test('two-level nesting: grandchild opening deepens ancestor targets', () => {
      const { manager, machines } = buildNestingChain()

      // Open child first
      machines.child.requestOpen()

      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)
      expect(manager.getNestingState('child').targetNestingDepth).toBe(0)

      // Now open grandchild
      machines.grandchild.requestOpen()

      expect(manager.getNestingState('root').targetNestingDepth).toBe(2)
      expect(manager.getNestingState('child').targetNestingDepth).toBe(1)
      expect(manager.getNestingState('grandchild').targetNestingDepth).toBe(0)
    })

    test('child closing resets targetNestingDepth on parent', () => {
      const { manager, machines } = buildNestingPair()

      // Open child
      machines.child.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)

      // Close child
      machines.child.requestClose() // Opening -> Closing

      expect(manager.getNestingState('root').targetNestingDepth).toBe(0)
    })

    test('grandchild closing reduces ancestor depths by one', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      machines.grandchild.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(2)
      expect(manager.getNestingState('child').targetNestingDepth).toBe(1)

      // Close grandchild
      machines.grandchild.requestClose()

      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)
      expect(manager.getNestingState('child').targetNestingDepth).toBe(0)
    })

    test('registerNestingTransition returns handle when animation is needed', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = manager.registerNestingTransition('root')
      expect(handle).not.toBeNull()
    })

    test('registerNestingTransition returns null when no animation is needed', () => {
      const { manager } = buildNestingPair()

      // No child opened — depth === targetDepth === 0
      const handle = manager.registerNestingTransition('root')
      expect(handle).toBeNull()
    })

    test('reportComplete commits nestingDepth to targetNestingDepth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)
      expect(manager.getNestingState('root').nestingDepth).toBe(0)

      const handle = manager.registerNestingTransition('root')
      assert(handle)
      handle.reportComplete()

      const rootState = manager.getNestingState('root')
      expect(rootState.nestingDepth).toBe(1)
      expect(rootState.targetNestingDepth).toBe(1)
    })

    test('reportComplete invalidates snapshot', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const snap1 = manager.getSnapshot()
      const handle = manager.registerNestingTransition('root')
      assert(handle)
      handle.reportComplete()

      const snap2 = manager.getSnapshot()
      expect(snap1).not.toBe(snap2)
    })

    test('reportComplete notifies subscribe listeners', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const listener = vi.fn()
      manager.subscribe(listener)
      listener.mockClear()

      const handle = manager.registerNestingTransition('root')
      assert(handle)
      handle.reportComplete()

      expect(listener).toHaveBeenCalled()
    })

    test('stale handle is ignored after target changes again', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = manager.registerNestingTransition('root')
      assert(firstHandle)

      // Before first animation completes, grandchild opens → new target
      machines.grandchild.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(2)

      // First handle's reportComplete should be ignored
      firstHandle.reportComplete()
      expect(manager.getNestingState('root').nestingDepth).toBe(0) // not committed
      expect(manager.getNestingState('root').targetNestingDepth).toBe(2) // unchanged
    })

    test('second handle works after first becomes stale', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = manager.registerNestingTransition('root')
      assert(firstHandle)

      machines.grandchild.requestOpen()

      const secondHandle = manager.registerNestingTransition('root')
      assert(secondHandle)
      secondHandle.reportComplete()

      expect(manager.getNestingState('root').nestingDepth).toBe(2)
      expect(manager.getNestingState('root').targetNestingDepth).toBe(2)
    })

    test('reportCancel does not commit nestingDepth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = manager.registerNestingTransition('root')
      assert(handle)
      handle.reportCancel()

      expect(manager.getNestingState('root').nestingDepth).toBe(0)
      expect(manager.getNestingState('root').targetNestingDepth).toBe(1) // unchanged
    })

    test('unregistering child recalculates ancestor nesting depth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)

      // Simulate the handle commit first
      const handle = manager.registerNestingTransition('root')
      assert(handle)
      handle.reportComplete()
      expect(manager.getNestingState('root').nestingDepth).toBe(1)

      // Now unregister the child — no open descendants remain
      // First we need the unregister function, so re-build the scenario
      const manager2 = new DrawerRegistry()
      const rootMachine = createMachine(true)
      const childMachine = createMachine(false)

      manager2.register({ id: 'root', parentId: null, machine: rootMachine })
      const unregChild = manager2.register({
        id: 'child',
        parentId: 'root',
        machine: childMachine,
      })

      childMachine.requestOpen()
      expect(manager2.getNestingState('root').targetNestingDepth).toBe(1)

      unregChild()

      // After unregister, root has no open descendants
      expect(manager2.getNestingState('root').targetNestingDepth).toBe(0)
    })

    test('nesting fields appear in DrawerNodeView from getNode', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const rootView = manager.getNode('root')
      assert(rootView)
      expect(rootView.nestingDepth).toBe(0)
      expect(rootView.targetNestingDepth).toBe(1)
    })

    test('nesting fields appear in getSnapshot', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const snapshot = manager.getSnapshot()
      const rootSnap = snapshot.find((n) => n.id === 'root')
      assert(rootSnap)
      expect(rootSnap.targetNestingDepth).toBe(1)
    })

    test('getNestingState returns default for unregistered id', () => {
      const manager = new DrawerRegistry()
      const state = manager.getNestingState('nonexistent')
      expect(state.nestingDepth).toBe(0)
      expect(state.targetNestingDepth).toBe(0)
    })

    test('registerNestingTransition returns null for unregistered id', () => {
      const manager = new DrawerRegistry()
      expect(manager.registerNestingTransition('nonexistent')).toBeNull()
    })

    test('registering a node with already-open descendants computes initial depth', () => {
      const manager = new DrawerRegistry()
      const childMachine = createMachine(true) // starts Idle (open)

      manager.register({
        id: 'root',
        parentId: null,
        machine: createMachine(true),
      })
      manager.register({
        id: 'child',
        parentId: 'root',
        machine: childMachine,
      })

      // Root should already see child as open
      const rootState = manager.getNestingState('root')
      expect(rootState.nestingDepth).toBe(1)
      expect(rootState.targetNestingDepth).toBe(1)
    })

    test('subscribe listener fires on nesting state change', () => {
      const { manager, machines } = buildNestingPair()

      const listener = vi.fn()
      manager.subscribe(listener)
      listener.mockClear()

      machines.child.requestOpen()

      // Listener should have fired (at least once for the phase change which
      // also triggers nesting recalculation)
      expect(listener).toHaveBeenCalled()
    })

    test('middle node removal recalculates root nesting depth', () => {
      const manager = new DrawerRegistry()
      const machines = {
        root: createMachine(true),
        child: createMachine(true),
        grandchild: createMachine(true),
      }

      manager.register({
        id: 'root',
        parentId: null,
        machine: machines.root,
      })
      const unregChild = manager.register({
        id: 'child',
        parentId: 'root',
        machine: machines.child,
      })
      manager.register({
        id: 'grandchild',
        parentId: 'child',
        machine: machines.grandchild,
      })

      // root nestingDepth = 2 (child + grandchild both open)
      expect(manager.getNestingState('root').targetNestingDepth).toBe(2)
      expect(manager.getNestingState('child').targetNestingDepth).toBe(1)

      // Remove child — grandchild still exists as orphan with parentId='child'
      // but child entry is gone, so root can't reach grandchild
      unregChild()

      expect(manager.getNestingState('root').targetNestingDepth).toBe(0)
    })

    test('sibling open warning in dev mode', () => {
      const manager = new DrawerRegistry()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      manager.register({
        id: 'root',
        parentId: null,
        machine: createMachine(true),
      })

      const childA = createMachine(true) // starts open
      manager.register({
        id: 'childA',
        parentId: 'root',
        machine: childA,
      })

      const childB = createMachine(false)
      manager.register({
        id: 'childB',
        parentId: 'root',
        machine: childB,
      })

      // Opening childB while childA is already open should warn
      childB.requestOpen()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Drawer "childB" is opening while sibling "childA" is already open',
        ),
      )

      warnSpy.mockRestore()
    })

    test('target falls back to committed depth when child closes before animation completes', () => {
      const { manager, machines } = buildNestingPair()

      // Open child -> root target becomes 1
      machines.child.requestOpen()
      expect(manager.getNestingState('root').targetNestingDepth).toBe(1)
      expect(manager.getNestingState('root').nestingDepth).toBe(0)

      // Close child before root's scale animation was registered
      machines.child.requestClose()

      // Target should be back to 0 and since nestingDepth was 0 too, no animation needed
      const rootState = manager.getNestingState('root')
      expect(rootState.targetNestingDepth).toBe(0)
      expect(rootState.nestingDepth).toBe(0)
    })
  })
})
