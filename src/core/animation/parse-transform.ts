/** @internal */
export function parseTransform(computedStyle: CSSStyleDeclaration): {
  x: number
  y: number
  z: number
} {
  const transform = computedStyle.transform

  if (!transform || transform === 'none') {
    return { x: 0, y: 0, z: 0 }
  }

  // matrix(a, b, c, d, tx, ty) — 2D transform
  const matrix2d = transform.match(/^matrix\((.+)\)$/)
  if (matrix2d) {
    const values = matrix2d[1]!.split(',').map((v) => parseFloat(v.trim()))
    return {
      x: values[4] ?? 0,
      y: values[5] ?? 0,
      z: 0,
    }
  }

  // matrix3d(a1..a16) — 3D transform, tx=a13, ty=a14, tz=a15
  const matrix3d = transform.match(/^matrix3d\((.+)\)$/)
  if (matrix3d) {
    const values = matrix3d[1]!.split(',').map((v) => parseFloat(v.trim()))
    return {
      x: values[12] ?? 0,
      y: values[13] ?? 0,
      z: values[14] ?? 0,
    }
  }

  return { x: 0, y: 0, z: 0 }
}
