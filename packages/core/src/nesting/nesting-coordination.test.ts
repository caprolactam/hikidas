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

/**
 * Build a two-level tree: root (open) > child (closed).
 */
function buildNestingPair(initialOpens: { root: boolean; child: boolean }) {
  const registry = new DrawerRegistry()
  const machines = {
    root: createMachine(initialOpens.root),
    child: createMachine(initialOpens.child),
  }

  registry.register({ id: 'root', parentId: null, machine: machines.root })
  registry.register({ id: 'child', parentId: 'root', machine: machines.child })

  return { registry, machines }
}

/**
 * Build a three-level tree: root (open) > child (closed) > grandchild (closed).
 */
function buildNestingChain(
  initialOpens: {
    root: boolean
    child: boolean
    grandchild: boolean
  } = {
    root: true,
    child: false,
    grandchild: false,
  },
) {
  const registry = new DrawerRegistry()
  const machines = {
    root: createMachine(initialOpens.root),
    child: createMachine(initialOpens.child),
    grandchild: createMachine(initialOpens.grandchild),
  }

  registry.register({ id: 'root', parentId: null, machine: machines.root })
  registry.register({ id: 'child', parentId: 'root', machine: machines.child })
  registry.register({
    id: 'grandchild',
    parentId: 'child',
    machine: machines.grandchild,
  })

  return { registry, machines }
}

function getNesting(registry: DrawerRegistry, id: string) {
  const node = registry.getNode(id)
  assert(node, `node "${id}" should be registered`)
  return node.nesting
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('nesting coordination', () => {
  describe('nesting scale coordination', () => {
    test('parent starts scale transition when child opens', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: false,
      })

      machines.child.requestOpen()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0)
      expect(nesting.targetDepth).toBe(1)
    })

    test('frontmost drawer is always nesting-inactive', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: false,
      })

      machines.child.requestOpen()

      const nesting = getNesting(registry, 'child')
      expect(nesting.phase).toBe(NestingPhase.Inactive)
    })

    test('parent starts scale transition when child closes', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: true,
      })

      machines.child.requestClose()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(1)
      expect(nesting.targetDepth).toBe(0)
    })

    test('opening grandchild deepens scale target for all ancestors', () => {
      const { registry, machines } = buildNestingChain({
        root: true,
        child: true,
        grandchild: false,
      })

      machines.grandchild.requestOpen()

      const root = getNesting(registry, 'root')
      assert(root.phase === NestingPhase.Scaling)
      expect(root.nestingDepth).toBe(1)
      expect(root.targetDepth).toBe(2)

      const child = getNesting(registry, 'child')
      assert(child.phase === NestingPhase.Scaling)
      expect(child.nestingDepth).toBe(0)
      expect(child.targetDepth).toBe(1)

      const grandChild = getNesting(registry, 'grandchild')
      expect(grandChild.phase).toBe(NestingPhase.Inactive)
    })

    test('closing grandchild reduces scale target for all ancestors', () => {
      const { registry, machines } = buildNestingChain({
        root: true,
        child: true,
        grandchild: true,
      })

      machines.grandchild.requestClose()

      const root = getNesting(registry, 'root')
      assert(root.phase === NestingPhase.Scaling)
      expect(root.nestingDepth).toBe(2)
      expect(root.targetDepth).toBe(1)

      const nesting = getNesting(registry, 'child')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(1)
      expect(nesting.targetDepth).toBe(0)
    })

    test('already-open child commits parent scale without animation', () => {
      const { registry } = buildNestingPair({
        root: true,
        child: true,
      })

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Active)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('already-open chain commits all ancestor scales without animation', () => {
      const { registry } = buildNestingChain({
        root: true,
        child: true,
        grandchild: true,
      })

      const root = getNesting(registry, 'root')
      assert(root.phase === NestingPhase.Active)
      expect(root.nestingDepth).toBe(2)

      const child = getNesting(registry, 'child')
      assert(child.phase === NestingPhase.Active)
      expect(child.nestingDepth).toBe(1)
    })

    test('completing scale animation commits the nesting depth', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: false,
      })

      machines.child.requestOpen()

      const handle = registry.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportComplete()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Active)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('animation handle is invalidated when target changes mid-animation', () => {
      const { registry, machines } = buildNestingChain({
        root: true,
        child: false,
        grandchild: false,
      })

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

    test('new animation succeeds after previous handle is invalidated', () => {
      const { registry, machines } = buildNestingChain({
        root: true,
        child: false,
        grandchild: false,
      })

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

    test('cancelled animation does not commit nesting depth', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: false,
      })

      machines.child.requestOpen()

      const handle = registry.registerNestingTransition('root')
      assert(handle.isTransitionable)
      handle.reportCancel()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.nestingDepth).toBe(0)
      expect(nesting.targetDepth).toBe(1)
    })

    test('child closing mid-animation reverses the scale target', () => {
      const { registry, machines } = buildNestingPair({
        root: true,
        child: false,
      })

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
  })

  describe('close propagation', () => {
    test('closing a parent propagates close to open child', () => {
      const {
        machines: { root, child },
      } = buildNestingPair({
        root: true,
        child: true,
      })

      root.requestClose()

      expect(root.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
    })

    test('close propagates recursively to grandchildren', () => {
      const {
        machines: { root, child, grandchild },
      } = buildNestingChain({
        root: true,
        child: true,
        grandchild: true,
      })

      root.requestClose()

      expect(root.snapshot.phase).toBe(Phase.Closing)
      expect(child.snapshot.phase).toBe(Phase.Closing)
      expect(grandchild.snapshot.phase).toBe(Phase.Closing)
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

    test('parent close with open child resets parent nesting targetDepth to 0', () => {
      const {
        registry,
        machines: { root },
      } = buildNestingPair({
        root: true,
        child: true,
      })

      assert(getNesting(registry, 'root').phase === NestingPhase.Active)

      root.requestClose()

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.Scaling)
      expect(nesting.targetDepth).toBe(0)
    })
  })

  describe('drag coordination', () => {
    test('child entering Dragging sets ancestors to DragControlled', () => {
      const {
        registry,
        machines: { child },
      } = buildNestingPair({ root: true, child: true })

      enterDragging(child)

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.DragControlled)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('child entering Settling sets ancestors to DragRestoring', () => {
      const {
        registry,
        machines: { child },
      } = buildNestingPair({ root: true, child: true })

      enterDragging(child)
      enterSettling(child)

      const nesting = getNesting(registry, 'root')
      assert(nesting.phase === NestingPhase.DragRestoring)
      expect(nesting.nestingDepth).toBe(1)
    })

    test('drag propagates DragControlled to all ancestors in chain', () => {
      const {
        registry,
        machines: { grandchild },
      } = buildNestingChain({ root: true, child: true, grandchild: true })

      enterDragging(grandchild)

      expect(getNesting(registry, 'root').phase).toBe(
        NestingPhase.DragControlled,
      )
      expect(getNesting(registry, 'child').phase).toBe(
        NestingPhase.DragControlled,
      )
    })

    test('settling propagates DragRestoring to all ancestors in chain', () => {
      const {
        registry,
        machines: { grandchild },
      } = buildNestingChain({ root: true, child: true, grandchild: true })

      enterDragging(grandchild)
      enterSettling(grandchild)

      expect(getNesting(registry, 'root').phase).toBe(
        NestingPhase.DragRestoring,
      )
      expect(getNesting(registry, 'child').phase).toBe(
        NestingPhase.DragRestoring,
      )
    })
  })

  describe('unregistration effects', () => {
    test('unregistering open child recalculates parent nesting depth', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)

      registry.register({ id: 'root', parentId: null, machine: root })
      const unregChild = registry.register({
        id: 'child',
        parentId: 'root',
        machine: child,
      })

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Active)
        expect(nesting.nestingDepth).toBe(1)
      }

      unregChild()

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(0)
      }
    })

    test('removing middle node disconnects subtree from ancestor nesting', () => {
      const registry = new DrawerRegistry()
      const root = createMachine(true)
      const child = createMachine(true)
      const grandchild = createMachine(true)

      registry.register({ id: 'root', parentId: null, machine: root })
      const unregChild = registry.register({
        id: 'child',
        parentId: 'root',
        machine: child,
      })
      registry.register({
        id: 'grandchild',
        parentId: 'child',
        machine: grandchild,
      })

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Active)
        expect(nesting.nestingDepth).toBe(2)
      }

      unregChild()

      {
        const nesting = getNesting(registry, 'root')
        assert(nesting.phase === NestingPhase.Scaling)
        expect(nesting.targetDepth).toBe(0)
      }
    })

    test('phase changes after unregister do not propagate to ancestors', () => {
      const registry = new DrawerRegistry()
      const machine = createMachine(false)

      registry.register({
        id: 'root',
        parentId: null,
        machine: createMachine(true),
      })
      const unreg = registry.register({
        id: 'child',
        parentId: 'root',
        machine,
      })
      unreg()
      const listener = vi.fn()
      registry.subscribe(listener)
      // Phase change on detached machine should not notify registry
      machine.requestOpen()

      expect(listener).not.toHaveBeenCalled()
    })
  })

  test('dev warnings when sibling drawer opens while another is already open', () => {
    const registry = new DrawerRegistry()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    registry.register({
      id: 'root',
      parentId: null,
      machine: createMachine(true),
    })
    registry.register({
      id: 'childA',
      parentId: 'root',
      machine: createMachine(true),
    })

    const childB = createMachine(false)
    registry.register({ id: 'childB', parentId: 'root', machine: childB })

    childB.requestOpen()

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Drawer "childB" is opening while sibling "childA" is already open',
      ),
    )
  })
})
