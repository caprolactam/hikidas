interface TransitionBarrier {
  reset(): void
  join(onCompleted: () => void): { done(): void }
}

/** @internal */
export function createTransitionBarrier(): TransitionBarrier {
  let transitionId = 0
  let pendingJoinCount = 0

  return {
    reset() {
      ++transitionId
      pendingJoinCount = 0
    },
    join(onCompleted) {
      const id = transitionId
      pendingJoinCount++

      let settled = false
      return {
        done() {
          if (settled) return
          settled = true
          if (transitionId !== id) return
          pendingJoinCount--
          if (pendingJoinCount === 0) {
            onCompleted()
          }
        },
      }
    },
  }
}
