import invariant from 'tiny-invariant'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { Phase } from './phase'
import { TransitionCoordinator } from './transition-coordinator'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TransitionCoordinator', () => {
  describe('onTransitionComplete is called only once per phase', () => {
    test('called only once when multiple parts finish, after the last one finishes', async () => {
      const onTransitionComplete = vi.fn()
      const transitionCoordinator = new TransitionCoordinator({
        onTransitionComplete,
      })

      const part1 = transitionCoordinator.register(Phase.Closing)
      const part2 = transitionCoordinator.register(Phase.Closing)

      invariant(part1.isTransitionable)
      invariant(part2.isTransitionable)

      part1.reportComplete()
      expect(onTransitionComplete).not.toHaveBeenCalled()

      part2.reportComplete()
      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
      expect(onTransitionComplete).toHaveBeenCalledWith(Phase.Closing)
    })
    test('called only once when reportComplete is called multiple times on the same subscription', async () => {
      const onTransitionComplete = vi.fn()
      const transitionCoordinator = new TransitionCoordinator({
        onTransitionComplete,
      })

      const part = transitionCoordinator.register(Phase.Closing)

      invariant(part.isTransitionable)

      part.reportComplete()
      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
      expect(onTransitionComplete).toHaveBeenCalledWith(Phase.Closing)

      part.reportComplete()
      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
    })
  })
  describe('Phase transition independence', () => {
    test('previous phase parts are ignored when a new phase transition starts', async () => {
      const onTransitionComplete = vi.fn()
      const transitionCoordinator = new TransitionCoordinator({
        onTransitionComplete,
      })

      const openingPart = transitionCoordinator.register(Phase.Opening)
      invariant(openingPart.isTransitionable)

      const closingPart = transitionCoordinator.register(Phase.Closing)
      invariant(closingPart.isTransitionable)

      openingPart.reportComplete()

      expect(onTransitionComplete).not.toHaveBeenCalled()

      closingPart.reportComplete()

      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
      expect(onTransitionComplete).toHaveBeenCalledWith(Phase.Closing)
    })
  })
  describe('Part removal behavior', () => {
    test('transition completes when all remaining parts are done after some parts are unregistered', async () => {
      const onTransitionComplete = vi.fn()
      const transitionCoordinator = new TransitionCoordinator({
        onTransitionComplete,
      })

      const part1 = transitionCoordinator.register(Phase.Opening)
      const part2 = transitionCoordinator.register(Phase.Opening)
      const part3 = transitionCoordinator.register(Phase.Opening)

      invariant(part1.isTransitionable)
      invariant(part2.isTransitionable)
      invariant(part3.isTransitionable)

      part2.unregister()

      part1.reportComplete()
      expect(onTransitionComplete).not.toHaveBeenCalled()

      part3.reportComplete()
      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
      expect(onTransitionComplete).toHaveBeenCalledWith(Phase.Opening)
    })

    test('transition completes when all remaining parts are done after some parts are cancelled', async () => {
      const onTransitionComplete = vi.fn()
      const transitionCoordinator = new TransitionCoordinator({
        onTransitionComplete,
      })

      const part1 = transitionCoordinator.register(Phase.Opening)
      const part2 = transitionCoordinator.register(Phase.Opening)
      const part3 = transitionCoordinator.register(Phase.Opening)

      invariant(part1.isTransitionable)
      invariant(part2.isTransitionable)
      invariant(part3.isTransitionable)

      part2.reportCancel()

      part1.reportComplete()
      expect(onTransitionComplete).not.toHaveBeenCalled()

      part3.reportComplete()
      expect(onTransitionComplete).toHaveBeenCalledTimes(1)
      expect(onTransitionComplete).toHaveBeenCalledWith(Phase.Opening)
    })
  })
})
