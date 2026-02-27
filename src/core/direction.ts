import type { DismissalDirection } from './types'

type Axis = 'x' | 'y'

class Direction {
  #value: DismissalDirection

  constructor(value: DismissalDirection) {
    this.#value = value
  }

  get dismissToward() {
    return this.#value
  }

  get axis(): Axis {
    switch (this.#value) {
      case 'up':
      case 'down':
        return 'y'
      case 'left':
      case 'right':
        return 'x'
    }
  }

  /**
   * Sign of the dismiss direction in CSS translate space.
   * +1 for down/right (dismiss moves in positive CSS direction)
   * -1 for up/left (dismiss moves in negative CSS direction)
   */
  get dismissSign(): -1 | 1 {
    switch (this.#value) {
      case 'up':
      case 'left':
        return -1
      case 'down':
      case 'right':
        return 1
    }
  }

  get isVertical(): boolean {
    return this.axis === 'y'
  }

  get isHorizontal(): boolean {
    return this.axis === 'x'
  }

  /**
   * Projects a 2D point/delta onto the dismiss axis and normalizes the sign
   * so that positive values represent movement toward dismiss/close, and
   * negative values represent movement toward open.
   */
  projectOnDismissAxis(point: { x: number; y: number }): number {
    const component = this.isVertical ? point.y : point.x
    return component * this.dismissSign
  }

  /**
   * Converts a scalar value in dismiss-positive space back to a CSS translate
   * vector {x, y}. Intended for use with style.transform translateX/Y.
   */
  dismissAxisToTranslate(value: number): { x: number; y: number } {
    const raw = value / this.dismissSign
    return this.isVertical ? { x: 0, y: raw } : { x: raw, y: 0 }
  }

  /**
   * Computes the CSS translate value (px) to position the drawer fully offscreen.
   */
  calcOffscreenTranslate(px: number): number {
    return px * this.dismissSign
  }

  sizeOnAxis(size: { height: number; width: number }): number {
    return this.isVertical ? size.height : size.width
  }
}

/** @internal */
export { type Direction }

/** @internal */
export function createDirection(direction: DismissalDirection): Direction {
  return new Direction(direction)
}
