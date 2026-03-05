import { describe, expect, test, vi, beforeEach, assert } from 'vitest'
import { DrawerMachine } from '../drawer/machine'
import { Phase } from '../drawer/phase'
import { DrawerRegistry, NestingPhase } from './registry'

// Phase import is only used in close-propagation tests

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
    test('registers a root node and retrieves it via getAncestors', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      manager.register({ id: 'a', parentId: null, machine })
      manager.register({
        id: 'child',
        parentId: 'a',
        machine: createMachine(),
      })

      const ancestors = manager.getAncestors('child')
      expect(ancestors).toHaveLength(1)
      expect(ancestors[0]!.id).toBe('a')
      expect(ancestors[0]!.parentId).toBeNull()
      expect(ancestors[0]!.depth).toBe(0)
    })

    test('unregister removes the node', () => {
      const manager = new DrawerRegistry()
      const machine = createMachine()

      const unregister = manager.register({
        id: 'a',
        parentId: null,
        machine,
      })
      manager.register({
        id: 'child',
        parentId: 'a',
        machine: createMachine(),
      })
      expect(manager.getAncestors('child')).toHaveLength(1)

      unregister()
      // Parent entry removed — getAncestors can no longer resolve it
      expect(manager.getAncestors('child')).toEqual([])
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
    })
  })

  // ── Tree queries ───────────────────────────────────────

  describe('tree queries', () => {
    test('getAncestors returns ancestors from immediate parent to root', () => {
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

      const ancestors = manager.getAncestors('grandchild')
      const ids = ancestors.map((n) => n.id)
      expect(ids).toEqual(['child1', 'root'])
    })

    test('getAncestors of root returns empty array', () => {
      const manager = new DrawerRegistry()

      manager.register({
        id: 'root',
        parentId: null,
        machine: createMachine(),
      })

      expect(manager.getAncestors('root')).toEqual([])
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

    test('isFrontmost returns false when no drawers are open', () => {
      const manager = new DrawerRegistry()
      manager.register({
        id: 'a',
        parentId: null,
        machine: createMachine(false),
      })

      expect(manager.isFrontmost('a')).toBe(false)
    })
  })

  // ── Subscribe ──────────────────────────────────────────

  describe('subscribe', () => {
    test('listener is called on register', () => {
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

    test('listener is called on unregister', () => {
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

    test('listener is called on machine phase change', () => {
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
  })

  // ── Edge cases ─────────────────────────────────────────

  describe('edge cases', () => {
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
      assert(rootState)
      expect(rootState.phase).toBe(NestingPhase.Inactive)

      const childState = manager.getNestingState('child')
      assert(childState)
      expect(childState.phase).toBe(NestingPhase.Inactive)
    })

    test('child opening sets targetNestingDepth on parent', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen() // Closed -> Opening

      const rootState = manager.getNestingState('root')
      assert(rootState)
      assert(rootState.phase === NestingPhase.Scaling)
      expect(rootState.nestingDepth).toBe(0) // not yet committed
      expect(rootState.targetDepth).toBe(1)
    })

    test('child node itself remains at nesting depth 0', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const childState = manager.getNestingState('child')
      assert(childState)
      expect(childState.phase).toBe(NestingPhase.Inactive)
    })

    test('two-level nesting: grandchild opening deepens ancestor targets', () => {
      const { manager, machines } = buildNestingChain()

      // Open child first
      machines.child.requestOpen()

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }
      {
        const state = manager.getNestingState('child')
        assert(state)
        expect(state.phase).toBe(NestingPhase.Inactive)
      }

      // Now open grandchild
      machines.grandchild.requestOpen()

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(2)
      }
      {
        const state = manager.getNestingState('child')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }
      {
        const state = manager.getNestingState('grandchild')
        assert(state)
        expect(state.phase).toBe(NestingPhase.Inactive)
      }
    })

    test('child closing resets targetNestingDepth on parent', () => {
      const { manager, machines } = buildNestingPair()

      // Open child
      machines.child.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }

      // Close child
      machines.child.requestClose() // Opening -> Closing

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(0)
      }
    })

    test('grandchild closing reduces ancestor depths by one', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      machines.grandchild.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(2)
      }
      {
        const state = manager.getNestingState('child')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }

      // Close grandchild
      machines.grandchild.requestClose()

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }
      {
        const state = manager.getNestingState('child')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(0)
      }
    })

    test('registerNestingTransition returns handle when animation is needed', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = manager.registerNestingTransition('root')
      expect(handle.isTransitionable).toBe(true)
    })

    test('registerNestingTransition returns isTransitionable: false when no animation is needed', () => {
      const { manager } = buildNestingPair()

      // No child opened — depth === targetDepth === 0
      const handle = manager.registerNestingTransition('root')
      expect(handle.isTransitionable).toBe(false)
    })

    test('reportComplete commits nestingDepth to targetNestingDepth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.nestingDepth).toBe(0)
        expect(state.targetDepth).toBe(1)
      }

      const handle = manager.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()

      const rootState = manager.getNestingState('root')
      assert(rootState)
      assert(rootState.phase === NestingPhase.Active)
      expect(rootState.nestingDepth).toBe(1)
    })

    test('reportComplete notifies subscribe listeners', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const listener = vi.fn()
      manager.subscribe(listener)
      listener.mockClear()

      const handle = manager.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()

      expect(listener).toHaveBeenCalled()
    })

    test('stale handle is ignored after target changes again', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = manager.registerNestingTransition('root')
      assert(firstHandle.isTransitionable)

      // Before first animation completes, grandchild opens → new target
      machines.grandchild.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(2)
      }

      // First handle's reportComplete should be ignored
      firstHandle.reportComplete()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.nestingDepth).toBe(0) // not committed
        expect(state.targetDepth).toBe(2) // unchanged
      }
    })

    test('second handle works after first becomes stale', () => {
      const { manager, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = manager.registerNestingTransition('root')
      assert(firstHandle.isTransitionable)

      machines.grandchild.requestOpen()

      const secondHandle = manager.registerNestingTransition('root')
      assert(secondHandle.isTransitionable)
      secondHandle.reportComplete()

      const rootState = manager.getNestingState('root')
      assert(rootState)
      assert(rootState.phase === NestingPhase.Active)
      expect(rootState.nestingDepth).toBe(2)
    })

    test('reportCancel does not commit nestingDepth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = manager.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportCancel()

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.nestingDepth).toBe(0)
        expect(state.targetDepth).toBe(1) // unchanged
      }
    })

    test('unregistering child recalculates ancestor nesting depth', () => {
      const { manager, machines } = buildNestingPair()

      machines.child.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }

      // Simulate the handle commit first
      const handle = manager.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Active)
        expect(state.nestingDepth).toBe(1)
      }

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
      {
        const state = manager2.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(1)
      }

      unregChild()

      // After unregister, root has no open descendants
      {
        const state = manager2.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(0)
      }
    })

    test('getNestingState returns null for unregistered id', () => {
      const manager = new DrawerRegistry()
      expect(manager.getNestingState('nonexistent')).toBeNull()
    })

    test('registerNestingTransition returns isTransitionable: false for unregistered id', () => {
      const manager = new DrawerRegistry()
      expect(manager.registerNestingTransition('nonexistent').isTransitionable).toBe(false)
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
      assert(rootState)
      assert(rootState.phase === NestingPhase.Active)
      expect(rootState.nestingDepth).toBe(1)
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
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Active)
        expect(state.nestingDepth).toBe(2)
      }
      {
        const state = manager.getNestingState('child')
        assert(state)
        assert(state.phase === NestingPhase.Active)
        expect(state.nestingDepth).toBe(1)
      }

      // Remove child — grandchild still exists as orphan with parentId='child'
      // but child entry is gone, so root can't reach grandchild
      unregChild()

      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(0)
      }
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

    // ── Close propagation ──────────────────────────────────

    test('closing a parent propagates close to open child', () => {
      const manager = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(true)

      manager.register({ id: 'parent', parentId: null, machine: parent })
      manager.register({ id: 'child', parentId: 'parent', machine: child })

      parent.requestClose()

      expect(parent.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
    })

    test('close propagates recursively to grandchildren', () => {
      const manager = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)
      const grandchild = createMachine(true)

      manager.register({ id: 'root', parentId: null, machine: root })
      manager.register({ id: 'child', parentId: 'root', machine: child })
      manager.register({
        id: 'grandchild',
        parentId: 'child',
        machine: grandchild,
      })

      root.requestClose()

      expect(root.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
      expect(grandchild.snapshot.phase).toBe(Phase.Closing)
    })

    test('closed child is not affected by parent close propagation', () => {
      const manager = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(false) // already Closed

      manager.register({ id: 'parent', parentId: null, machine: parent })
      manager.register({ id: 'child', parentId: 'parent', machine: child })

      parent.requestClose()

      expect(parent.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closed)
    })

    test('closing a root does not affect unrelated root drawers', () => {
      const manager = new DrawerRegistry()
      const rootA = createMachine(true)
      const rootB = createMachine(true)

      manager.register({ id: 'rootA', parentId: null, machine: rootA })
      manager.register({ id: 'rootB', parentId: null, machine: rootB })

      rootA.requestClose()

      expect(rootA.snapshot.phase).toBe(Phase.Closing)
      expect(rootB.snapshot.phase).toBe(Phase.Idle)
    })

    test('child in Opening phase is propagated close correctly', () => {
      const manager = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(false)

      manager.register({ id: 'parent', parentId: null, machine: parent })
      manager.register({ id: 'child', parentId: 'parent', machine: child })

      child.requestOpen() // Closed -> Opening
      expect(child.snapshot.phase).toBe(Phase.Opening)

      parent.requestClose()

      expect(child.snapshot.phase).toBe(Phase.Closing)
    })

    test('child already in Closing phase is not double-closed', () => {
      const manager = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(true)

      manager.register({ id: 'parent', parentId: null, machine: parent })
      manager.register({ id: 'child', parentId: 'parent', machine: child })

      child.requestClose() // child enters Closing independently
      expect(child.snapshot.phase).toBe(Phase.Closing)

      // requestClose() on Closing is a no-op in the reducer
      parent.requestClose()

      expect(child.snapshot.phase).toBe(Phase.Closing)
      expect(parent.snapshot.phase).toBe(Phase.Closing)
    })

    test('nesting depth on parent drops to 0 when parent closes with open child', () => {
      const manager = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(true)

      manager.register({ id: 'parent', parentId: null, machine: parent })
      manager.register({ id: 'child', parentId: 'parent', machine: child })

      {
        const state = manager.getNestingState('parent')
        assert(state)
        assert(state.phase === NestingPhase.Active)
        expect(state.nestingDepth).toBe(1)
      }

      parent.requestClose()

      {
        const state = manager.getNestingState('parent')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.targetDepth).toBe(0)
      }
    })

    test('target falls back to committed depth when child closes before animation completes', () => {
      const { manager, machines } = buildNestingPair()

      // Open child -> root target becomes 1
      machines.child.requestOpen()
      {
        const state = manager.getNestingState('root')
        assert(state)
        assert(state.phase === NestingPhase.Scaling)
        expect(state.nestingDepth).toBe(0)
        expect(state.targetDepth).toBe(1)
      }

      // Close child before root's scale animation was registered
      machines.child.requestClose()

      // Target reverses back to nestingDepth — animation should redirect to 0
      const rootState = manager.getNestingState('root')
      assert(rootState)
      assert(rootState.phase === NestingPhase.Scaling)
      expect(rootState.nestingDepth).toBe(0)
      expect(rootState.targetDepth).toBe(0)
    })
  })
})
