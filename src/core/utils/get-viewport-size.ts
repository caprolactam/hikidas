interface Size {
  width: number
  height: number
}

/** @internal */
export function getViewportSize(): Size {
  if (typeof window === 'undefined') return { width: 0, height: 0 }

  const viewport = window.visualViewport
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  }
}
