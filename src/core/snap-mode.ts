/** @internal */
export type SnapMode =
  | { type: 'binary' }
  | { type: 'snap'; ratios: number[]; activeIndex: number }

/** @internal */
export function computeSnapMode(
  snapPoints: number[] | undefined,
  activeIndex: number | undefined,
): SnapMode {
  if (!snapPoints || snapPoints.length === 0) {
    return { type: 'binary' }
  }

  const targetIndex = activeIndex ?? snapPoints.length - 1

  if (snapPoints[targetIndex] == null) {
    if (__DEV__) {
      throw new Error(
        `Invalid snap mode: activeIndex ${targetIndex} is out of bounds for ratios array of length ${snapPoints.length}`,
      )
    } else {
      throw new Error(`[Drawer] Invalid state`)
    }
  }

  return {
    type: 'snap',
    ratios: snapPoints,
    activeIndex: targetIndex,
  }
}

/** @internal */
export function getActiveSnapRatio(snapMode: SnapMode): number {
  if (snapMode.type === 'binary') return 1.0

  // The non-null assertion is safe here because computeSnapMode ensures that activeIndex is valid
  return snapMode.ratios[snapMode.activeIndex]!
}

/** @internal */
export function getMinSnapRatio(snapMode: SnapMode): number {
  if (snapMode.type === 'binary') return 1.0

  // The non-null assertion is safe here because computeSnapMode ensures ratios is non-empty
  return snapMode.ratios[0]!
}

/** @internal */
export function getMaxSnapRatio(snapMode: SnapMode): number {
  if (snapMode.type === 'binary') return 1.0

  // The non-null assertion is safe here because computeSnapMode ensures ratios is non-empty
  return snapMode.ratios[snapMode.ratios.length - 1]!
}

/** @internal */
export function snapModeEquals(target: SnapMode, prev: SnapMode): boolean {
  if (target.type !== prev.type) return false
  if (target.type === 'binary') return true
  const prevSnap = prev as Extract<SnapMode, { type: 'snap' }>
  return (
    target.activeIndex === prevSnap.activeIndex &&
    target.ratios.length === prevSnap.ratios.length &&
    target.ratios.every((p, i) => p === prevSnap.ratios[i])
  )
}

/**
 * Returns a new SnapMode with the activeIndex updated to nextActiveIndex.
 * For binary mode, returns the same instance unchanged.
 * @internal
 */
export function resolveNextSnapMode(
  snapMode: SnapMode,
  nextActiveIndex: number,
): SnapMode {
  if (snapMode.type === 'binary') return snapMode

  if (snapMode.ratios[nextActiveIndex] == null) {
    if (__DEV__) {
      throw new Error(
        `Invalid snap mode: nextActiveIndex ${nextActiveIndex} is out of bounds for ratios array of length ${snapMode.ratios.length}`,
      )
    } else {
      throw new Error(`[Drawer] Invalid state`)
    }
  }

  return { ...snapMode, activeIndex: nextActiveIndex }
}

/**
 * Returns the ratios array and activeIndex in a unified form regardless of mode type.
 * Binary mode is treated as a single snap at ratio 1.0 (index 0).
 * @internal
 */
export function normalizeSnapMode(snapMode: SnapMode): {
  ratios: number[]
  activeIndex: number
} {
  return snapMode.type === 'binary'
    ? { ratios: [1.0], activeIndex: 0 }
    : snapMode
}
