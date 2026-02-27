import type { Locator, Page } from '@playwright/test'
import invariant from 'tiny-invariant'

export const storyUrl = (id: string) =>
  `http://localhost:6006/iframe.html?id=${id}&viewMode=story`

/**
 * A drag gesture in progress. Terminated by calling `.up()` or `.cancel()`.
 * After termination, the gesture is no longer usable — call `dragStart()` again.
 */
class DragGesture {
  #done = false
  #currentX: number
  #currentY: number

  constructor(
    private readonly page: Page,
    private readonly handle: Locator,
    startX: number,
    startY: number,
  ) {
    this.#currentX = startX
    this.#currentY = startY
  }

  async move({
    deltaX = 0,
    deltaY = 0,
    steps = 10,
  }: { deltaX?: number; deltaY?: number; steps?: number } = {}): Promise<void> {
    this.#assertActive()
    this.#currentX += deltaX
    this.#currentY += deltaY
    await this.page.mouse.move(this.#currentX, this.#currentY, { steps })
  }

  async settle(ms: number): Promise<void> {
    this.#assertActive()
    await this.page.waitForTimeout(ms)
  }

  async up(): Promise<void> {
    this.#assertActive()
    this.#done = true
    await this.page.mouse.up()
  }

  async cancel(): Promise<void> {
    this.#assertActive()
    this.#done = true
    await this.handle.dispatchEvent('pointercancel')
    await this.page.mouse.up()
  }

  #assertActive(): void {
    if (this.#done) {
      throw new Error(
        'DragGesture has already ended. Call dragStart() to begin a new gesture.',
      )
    }
  }
}

/**
 * Begin a drag gesture from the center of the handle element.
 * Returns a DragGesture that must be terminated with `.up()` or `.cancel()`.
 */
export async function dragStart(
  page: Page,
  handle: Locator,
): Promise<DragGesture> {
  const box = await handle.boundingBox()
  invariant(box, 'Handle bounding box not found')

  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await page.mouse.move(cx, cy)
  await page.mouse.down()

  return new DragGesture(page, handle, cx, cy)
}

/**
 * Perform a complete drag gesture from the center of the handle element.
 */
export async function drag(
  page: Page,
  handle: Locator,
  {
    deltaX = 0,
    deltaY = 0,
    steps = 10,
    slowly = false,
  }: {
    deltaX?: number
    deltaY?: number
    steps?: number
    slowly?: boolean
  } = {},
): Promise<void> {
  const gesture = await dragStart(page, handle)
  await gesture.move({ deltaX, deltaY, steps })
  if (slowly) {
    await gesture.settle(300)
  }
  await gesture.up()
}

export async function waitForAnimationEnd(
  page: Page,
  timeout = 1000,
): Promise<void> {
  await page.waitForTimeout(timeout)
}

export const getStyleValue = <T extends keyof CSSStyleDeclaration>(
  locator: Locator,
  key: T,
) => {
  return locator.evaluate((e, key) => (e as HTMLElement).style[key], key)
}
