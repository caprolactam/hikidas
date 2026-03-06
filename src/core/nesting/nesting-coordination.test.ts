import { describe, expect, test, vi, beforeEach, assert } from 'vitest'
import { DrawerMachine } from '../drawer/machine'
import { Phase } from '../drawer/phase'
import { DrawerRegistry, NestingPhase } from './registry'

function createMachine(initialOpen = false): DrawerMachine {
  return new DrawerMachine(
    initialOpen,
    { snapPoints: undefined, snapPointIndex: undefined },
    { dismissalDirection: 'down', disableDragDismiss: false },
  )
}

/**
 * Transition a machine to Dragging phase: Idle → Tracking → Dragging.
 */
function enterDragging(machine: DrawerMachine): void {
  machine.startTracking()
  machine.startDrag({
    draggedDistance: { x: 0, y: 100 },
    dragStartMinDistancePx: 0,
  })
}

/**
 * Transition a machine from Dragging to Settling: Dragging → Settling.
 */
function enterSettling(machine: DrawerMachine): void {
  machine.endDrag({
    velocityPxPerSec: 0,
    isVelocityStale: false,
    dragDistanceRatio: 0,
    drawerSize: 500,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

/**
 * Build a two-level tree: root (open) > child (closed).
 */
function buildNestingPair() {
  const registry = new DrawerRegistry()
  const machines = {
    root: createMachine(true),
    child: createMachine(false),
  }

  registry.register({ id: 'root', parentId: null, machine: machines.root })
  registry.register({ id: 'child', parentId: 'root', machine: machines.child })

  return { registry, machines }
}

/**
 * Build a three-level tree: root (open) > child (closed) > grandchild (closed).
 */
function buildNestingChain() {
  const registry = new DrawerRegistry()
  const machines = {
    root: createMachine(true),
    child: createMachine(false),
    grandchild: createMachine(false),
  }

  registry.register({ id: 'root', parentId: null, machine: machines.root })
  registry.register({ id: 'child', parentId: 'root', machine: machines.child })
  registry.register({ id: 'grandchild', parentId: 'child', machine: machines.grandchild })

  return { registry, machines }
}

function getNesting(registry: DrawerRegistry, id: string) {
  const node = registry.getNode(id)
  assert(node, `node "${id}" should be registered`)
  return node.nesting
}

describe('nesting coordination', () => {
  // ── Nesting scale coordination ──────────────────────────────
  describe('nesting scale coordination', () => {
    test('child opening sets parent to Scaling with targetDepth=1', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0)
      expect(nesting.targetDepth).toBe(1)
    })

    test('child opening does not affect child own nesting state', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      const nesting = getNesting(registry, 'child')
      expect(nesting.phase).toBe(NestingPhase.Inactive)
    })

    test('child closing resets parent targetDepth to 0', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()
      machines.child.requestClose()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.targetDepth).toBe(0)
    })

    test('grandchild opening deepens ancestor targets (root=2, child=1)', () => {
      const { registry, machines } = buildNestingChain()

      machines.child.requestOpen()
      machines.grandchild.requestOpen()

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(2)
      }
      {
        const nesting = getNesting(registry, 'child')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(1)
      }
      {
        const nesting = getNesting(registry, 'grandchild')
        expect(nesting.phase).toBe(NestingPhase.Inactive)
      }
    })

    test('grandchild closing reduces ancestor depths by one', () => {
      const { registry, machines } = buildNestingChain()

      machines.child.requestOpen()
      machines.grandchild.requestOpen()
      machines.grandchild.requestClose()

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(1)
      }
      {
        const nesting = getNesting(registry, 'child')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(0)
      }
    })

    test('child registered with initialOpen commits parent depth immediately (no animation)', () => {
      const registry = new DrawerRegistry()

      registry.register({ id: 'root', parentId: null, machine: createMachine(true) })
      registry.register({ id: 'child', parentId: 'root', machine: createMachine(true) })

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Active)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('reportComplete commits nestingDepth and transitions to Active', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = registry.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Active)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('stale handle is ignored after target changes again', () => {
      const { registry, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = registry.registerNestingTransition('root')
      assert(firstHandle.isTransitionable)

      // Before first animation completes, grandchild opens → new target
      machines.grandchild.requestOpen()

      // First handle's reportComplete should be ignored
      firstHandle.reportComplete()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0) // not committed
      expect(nesting.targetDepth).toBe(2)
    })

    test('second handle works after first becomes stale', () => {
      const { registry, machines } = buildNestingChain()

      machines.child.requestOpen()
      const firstHandle = registry.registerNestingTransition('root')
      assert(firstHandle.isTransitionable)

      machines.grandchild.requestOpen()

      const secondHandle = registry.registerNestingTransition('root')
      assert(secondHandle.isTransitionable)
      secondHandle.reportComplete()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Active)
      expect(nesting.nestingDepth).toBe(2)
    })

    test('reportCancel does not commit nestingDepth', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      const handle = registry.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportCancel()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0)
      expect(nesting.targetDepth).toBe(1)
    })

    test('child closing before animation completes reverses target back', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()
      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(1)
      }

      machines.child.requestClose()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0)
      expect(nesting.targetDepth).toBe(0)
    })

    test('reportComplete notifies subscribe listeners', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      const listener = vi.fn()
      registry.subscribe(listener)
      listener.mockClear()

      const handle = registry.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()

      expect(listener).toHaveBeenCalled()
    })
  })

  // ── Close propagation ───────────────────────────────────────
  describe('close propagation', () => {
    test('closing a parent propagates close to open child', () => {
      const registry = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(true)

      registry.register({ id: 'parent', parentId: null, machine: parent })
      registry.register({ id: 'child', parentId: 'parent', machine: child })

      parent.requestClose()

      expect(parent.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
    })

    test('close propagates recursively to grandchildren', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)
      const grandchild = createMachine(true)

      registry.register({ id: 'root', parentId: null, machine: root })
      registry.register({ id: 'child', parentId: 'root', machine: child })
      registry.register({ id: 'grandchild', parentId: 'child', machine: grandchild })

      root.requestClose()

      expect(root.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
      expect(grandchild.snapshot.phase).toBe(Phase.Closing)
    })

    test('closed child is not affected by parent close propagation', () => {
      const registry = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(false)

      registry.register({ id: 'parent', parentId: null, machine: parent })
      registry.register({ id: 'child', parentId: 'parent', machine: child })

      parent.requestClose()

      expect(parent.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closed)
    })

    test('closing a root does not affect unrelated root drawers', () => {
      const registry = new DrawerRegistry()
      const rootA = createMachine(true)
      const rootB = createMachine(true)

      registry.register({ id: 'rootA', parentId: null, machine: rootA })
      registry.register({ id: 'rootB', parentId: null, machine: rootB })

      rootA.requestClose()

      expect(rootA.snapshot.phase).toBe(Phase.Closing)
      expect(rootB.snapshot.phase).toBe(Phase.Idle)
    })

    test('child in Opening phase is closed when parent closes', () => {
      const registry = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(false)

      registry.register({ id: 'parent', parentId: null, machine: parent })
      registry.register({ id: 'child', parentId: 'parent', machine: child })

      child.requestOpen()
      expect(child.snapshot.phase).toBe(Phase.Opening)

      parent.requestClose()

      expect(child.snapshot.phase).toBe(Phase.Closing)
    })

    test('parent close with open child resets parent nesting targetDepth to 0', () => {
      const registry = new DrawerRegistry()
      const parent = createMachine(true)
      const child = createMachine(true)

      registry.register({ id: 'parent', parentId: null, machine: parent })
      registry.register({ id: 'child', parentId: 'parent', machine: child })

      {
        const nesting = getNesting(registry, 'parent')
        assert(nesting.phase === NestingPhase.Active)
        expect(nesting.nestingDepth).toBe(1)
      }

      parent.requestClose()

      const nesting = getNesting(registry, 'parent')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.targetDepth).toBe(0)
    })
  })

  // ── Drag coordination ──────────────────────────────────────
  describe('drag coordination', () => {
    test('child entering Dragging sets ancestors to DragControlled', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true) // starts Idle (open)

      registry.register({ id: 'root', parentId: null, machine: root })
      registry.register({ id: 'child', parentId: 'root', machine: child })

      enterDragging(child)

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.DragControlled)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('child entering Settling sets ancestors to DragRestoring', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)

      registry.register({ id: 'root', parentId: null, machine: root })
      registry.register({ id: 'child', parentId: 'root', machine: child })

      enterDragging(child)
      enterSettling(child)

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.DragRestoring)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('drag propagates DragControlled to all ancestors in chain', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)
      const grandchild = createMachine(true)

      registry.register({ id: 'root', parentId: null, machine: root })
      registry.register({ id: 'child', parentId: 'root', machine: child })
      registry.register({ id: 'grandchild', parentId: 'child', machine: grandchild })

      enterDragging(grandchild)

      {
        const nesting = getNesting(registry, 'root')
        expect(nesting.phase).toBe(NestingPhase.DragControlled)
      }
      {
        const nesting = getNesting(registry, 'child')
        expect(nesting.phase).toBe(NestingPhase.DragControlled)
      }
    })

    test('isFrontmost returns true for deepest open drawer', () => {
      const { registry, machines } = buildNestingPair()

      machines.child.requestOpen()

      expect(registry.isFrontmost('child')).toBe(true)
      expect(registry.isFrontmost('root')).toBe(false)
    })

    test('isFrontmost returns false when all drawers are closed', () => {
      const registry = new DrawerRegistry()
      registry.register({ id: 'a', parentId: null, machine: createMachine(false) })

      expect(registry.isFrontmost('a')).toBe(false)
    })

    test('getAncestors returns ancestor nodes with nesting state', () => {
      const { registry, machines } = buildNestingChain()

      machines.child.requestOpen()
      machines.grandchild.requestOpen()

      const ancestors = registry.getAncestors('grandchild')
      expect(ancestors.map((a) => a.id)).toEqual(['child', 'root'])

      // Verify ancestors carry nesting state (used by DragRegistry for scale interpolation)
      const childAncestor = ancestors.find((a) => a.id === 'child')!
      assert(childAncestor.nesting.phase === NestingPhase.Scaling)
      expect(childAncestor.nesting.targetDepth).toBe(1)

      const rootAncestor = ancestors.find((a) => a.id === 'root')!
      assert(rootAncestor.nesting.phase === NestingPhase.Scaling)
      expect(rootAncestor.nesting.targetDepth).toBe(2)
    })
  })

  // ── Unregistration effects ──────────────────────────────────
  describe('unregistration effects', () => {
    test('unregistering open child recalculates parent nesting depth', () => {
      const registry = new DrawerRegistry()
      const rootMachine = createMachine(true)
      const childMachine = createMachine(false)

      registry.register({ id: 'root', parentId: null, machine: rootMachine })
      const unregChild = registry.register({
        id: 'child',
        parentId: 'root',
        machine: childMachine,
      })

      childMachine.requestOpen()
      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(1)
      }

      unregChild()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.targetDepth).toBe(0)
    })

    test('middle node removal resets root depth to 0', () => {
      const registry = new DrawerRegistry()
      const machines = {
        root: createMachine(true),
        child: createMachine(true),
        grandchild: createMachine(true),
      }

      registry.register({ id: 'root', parentId: null, machine: machines.root })
      const unregChild = registry.register({
        id: 'child',
        parentId: 'root',
        machine: machines.child,
      })
      registry.register({
        id: 'grandchild',
        parentId: 'child',
        machine: machines.grandchild,
      })

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Active)
        expect(nesting.nestingDepth).toBe(2)
      }

      unregChild()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.targetDepth).toBe(0)
    })

    test('phase changes after unregister do not propagate to ancestors', () => {
      const registry = new DrawerRegistry()
      const machine = createMachine(false)

      registry.register({ id: 'root', parentId: null, machine: createMachine(true) })
      const unreg = registry.register({ id: 'child', parentId: 'root', machine })

      unreg()

      const listener = vi.fn()
      registry.subscribe(listener)

      // Phase change on detached machine should not notify registry
      machine.requestOpen()
      expect(listener).not.toHaveBeenCalled()
    })
  })

  // ── Dev warnings ────────────────────────────────────────────
  describe('dev warnings', () => {
    test('warns when sibling drawer opens while another is already open', () => {
      const registry = new DrawerRegistry()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      registry.register({ id: 'root', parentId: null, machine: createMachine(true) })
      registry.register({ id: 'childA', parentId: 'root', machine: createMachine(true) })

      const childB = createMachine(false)
      registry.register({ id: 'childB', parentId: 'root', machine: childB })

      childB.requestOpen()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Drawer "childB" is opening while sibling "childA" is already open',
        ),
      )

      warnSpy.mockRestore()
    })
  })
})
