import { describe, expect, test, assert } from 'vitest'
import { DrawerMachine } from '../drawer/machine'
import { DrawerRegistry, NestingPhase } from './registry'

function createMachine(initialOpen = false): DrawerMachine {
  return new DrawerMachine(
    initialOpen,
    { snapPoints: undefined, snapPointIndex: undefined },
    { dismissalDirection: 'down', disableDragDismiss: false },
  )
}

describe('DrawerRegistry', () => {
  test('isFrontmost returns true for deepest open drawer', () => {
    const registry = new DrawerRegistry()
    const root = createMachine(true)
    const child = createMachine(false)

    registry.register({ id: 'root', parentId: null, machine: root })
    registry.register({ id: 'child', parentId: 'root', machine: child })

    child.requestOpen()

    expect(registry.isFrontmost('child')).toBe(true)
    expect(registry.isFrontmost('root')).toBe(false)
  })

  test('isFrontmost returns false when all drawers are closed', () => {
    const registry = new DrawerRegistry()
    registry.register({
      id: 'a',
      parentId: null,
      machine: createMachine(false),
    })

    expect(registry.isFrontmost('a')).toBe(false)
  })

  test('getAncestors returns ancestor nodes', () => {
    const registry = new DrawerRegistry()
    const root = createMachine(true)
    const child = createMachine(true)
    const grandchild = createMachine(true)

    registry.register({ id: 'root', parentId: null, machine: root })
    registry.register({ id: 'child', parentId: 'root', machine: child })
    registry.register({
      id: 'grandchild',
      parentId: 'child',
      machine: grandchild,
    })

    const ancestors = registry.getAncestors('grandchild')
    expect(ancestors.map((a) => a.id)).toEqual(['child', 'root'])

    const childAncestor = ancestors.find((a) => a.id === 'child')!
    expect(childAncestor.depth).toBe(1)
    assert(childAncestor.nesting.phase === NestingPhase.Active)
    expect(childAncestor.nesting.nestingDepth).toBe(1)

    const rootAncestor = ancestors.find((a) => a.id === 'root')!
    expect(rootAncestor.depth).toBe(0)
    assert(rootAncestor.nesting.phase === NestingPhase.Active)
    expect(rootAncestor.nesting.nestingDepth).toBe(2)
  })
})
