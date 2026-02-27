import { test, expect, type Page } from '@playwright/test'
import {
  storyUrl,
  drag,
  dragStart,
  waitForAnimationEnd,
  getStyleValue,
} from './utils'

async function openDrawer(page: Page) {
  await page.getByRole('button', { name: 'Open Drawer' }).click()
  await waitForAnimationEnd(page)

  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()

  return drawer
}

async function getDrawerTopY(
  drawer: ReturnType<Page['getByRole']>,
): Promise<number> {
  const box = await drawer.boundingBox()
  if (!box) throw new Error('Dialog bounding box not found')
  return box.y
}

async function getTranslateY(
  drawer: ReturnType<Page['getByRole']>,
): Promise<number> {
  const transform = await getStyleValue(drawer, 'transform')
  if (!transform) return 0
  const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)px\)/)
  return match ? parseFloat(match[1]) : 0
}

test.describe('Default', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--default'))
  })

  test('clicking the trigger button opens the drawer', async ({ page }) => {
    const drawer = page.getByRole('dialog')
    await expect(drawer).not.toBeVisible()

    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('clicking the close button dismisses the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    await page.getByRole('button', { name: 'Close' }).click()
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('clicking the overlay dismisses the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    await page.getByTestId('overlay').click()
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('dragging down past the threshold dismisses the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('dragging below the threshold snaps the drawer back open', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 50, slowly: true })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('drag cancelled mid-gesture keeps the drawer open', async ({ page }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    const gesture = await dragStart(page, handle)
    await gesture.move({ deltaY: 200 })
    await gesture.cancel()
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('context menu during drag cancels the gesture', async ({ page }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    const gesture = await dragStart(page, handle)
    await gesture.move({ deltaY: 200 })

    await handle.dispatchEvent('contextmenu')
    await page.mouse.up()
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('the drawer can be reopened after being closed', async ({ page }) => {
    const drawer = page.getByRole('dialog')

    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)
    await expect(drawer).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await waitForAnimationEnd(page)
    await expect(drawer).not.toBeVisible()

    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)
    await expect(drawer).toBeVisible()
  })
})

test.describe('InitiallyOpen', () => {
  test('drawer with defaultOpen is visible on mount', async ({ page }) => {
    await page.goto(storyUrl('drawer--initially-open-with-uncontrolled'))
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('drawer with open={true} is visible on mount', async ({ page }) => {
    await page.goto(storyUrl('drawer--initially-open-with-controlled'))
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

test.describe('Controlled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--controlled'))
  })

  test('opening the drawer updates external state', async ({ page }) => {
    await expect(page.getByTestId('state')).toHaveText('State: Closed')

    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('state')).toHaveText('State: Open')
  })

  test('closing the drawer updates external state', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    await page.getByRole('button', { name: 'Close' }).click()
    await waitForAnimationEnd(page)

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByTestId('state')).toHaveText('State: Closed')
  })

  test('dragging past the threshold updates external state', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    const drawer = page.getByRole('dialog')
    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
    await expect(page.getByTestId('state')).toHaveText('State: Closed')
  })
})

test.describe('Dismissal Direction', () => {
  test.describe('Direction Down', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(storyUrl('drawer--direction-down'))
    })

    test('closes by dragging down', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 200 })
      await waitForAnimationEnd(page)

      await expect(drawer).not.toBeVisible()
    })

    test('dragging up does not close the drawer', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: -100 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })

  test.describe('Direction Up', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(storyUrl('drawer--direction-up'))
    })

    test('closes by dragging up', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: -200 })
      await waitForAnimationEnd(page)

      await expect(drawer).not.toBeVisible()
    })

    test('dragging down does not close the drawer', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 100 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })

  test.describe('Direction Left', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(storyUrl('drawer--direction-left'))
    })

    test('closes by dragging left', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaX: -200 })
      await waitForAnimationEnd(page)

      await expect(drawer).not.toBeVisible()
    })

    test('dragging right does not close the drawer', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaX: 100 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })

  test.describe('Direction Right', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(storyUrl('drawer--direction-right'))
    })

    test('closes by dragging right', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaX: 200 })
      await waitForAnimationEnd(page)

      await expect(drawer).not.toBeVisible()
    })

    test('dragging left does not close the drawer', async ({ page }) => {
      const drawer = await openDrawer(page)
      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaX: -100 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })
})

test.describe('DisableDragDismiss', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--disable-drag-dismiss'))
  })

  test('dragging past the threshold does not dismiss the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('flicking does not dismiss the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 300, steps: 2 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })
})

test.describe('SnapPoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--snap-points'))
  })

  test('dragging down slowly snaps to the next lower snap point', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const translateYBefore = await getTranslateY(drawer)
    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 100, slowly: true })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
    const translateYAfter = await getTranslateY(drawer)
    expect(translateYAfter - translateYBefore).toBe(150)
  })

  test('a small drag snaps the drawer back to the highest snap point', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const translateYBefore = await getTranslateY(drawer)
    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 50, slowly: true })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
    const translateYAfter = await getTranslateY(drawer)
    expect(translateYAfter).toBe(translateYBefore)
  })

  test('dragging up slowly from a lower snap point snaps to the next higher snap point', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const handle = drawer.getByTestId('drag-handle')

    // First snap down from 100% to 50%
    await drag(page, handle, { deltaY: 100, slowly: true })
    await waitForAnimationEnd(page)
    const translateYAt50 = await getTranslateY(drawer)

    // Then drag up to snap back to 100%
    await drag(page, handle, { deltaY: -100, slowly: true })
    await waitForAnimationEnd(page)
    const translateYBack = await getTranslateY(drawer)

    expect(translateYBack).toBeLessThan(translateYAt50)
  })

  test('dragging far past the lowest snap point closes the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 400, slowly: true })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('a fast flick down closes the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 500, steps: 2 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })
})

test.describe('SnapPointsWithDefaultIndex', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--snap-points-with-default-index'))
  })

  test('opens to the middle (50%) snap point by default', async ({ page }) => {
    const drawer = await openDrawer(page)

    const transform = await getStyleValue(drawer, 'transform')
    expect(transform).toBe('translateX(0px) translateY(150px) translateZ(0px)')
  })

  test('flicking up from the default snap point moves to the 100% snap point', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const topYBefore = await getDrawerTopY(drawer)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: -150, slowly: true })
    await waitForAnimationEnd(page)

    const topYAfter = await getDrawerTopY(drawer)
    await expect(drawer).toBeVisible()
    expect(topYAfter - topYBefore).toBeLessThan(150)
  })
})

test.describe('ControlledSnapPoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--controlled-snap-points'))
  })

  test('initial active snap index is 2 (100%)', async ({ page }) => {
    await expect(page.getByText('Active Snap Index: 2')).toBeVisible()
    await expect(page.getByText('Active Snap Ratio: 100%')).toBeVisible()
  })

  test('clicking the 50% snap button changes the active snap index to 0', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    await page.getByRole('button', { name: '50%' }).click()
    await waitForAnimationEnd(page)

    await expect(page.getByText('Active Snap Index: 0')).toBeVisible()
    await expect(page.getByText('Active Snap Ratio: 50%')).toBeVisible()
    await expect(drawer).toBeVisible()
  })

  test('dragging down updates the active snap index', async ({ page }) => {
    const drawer = await openDrawer(page)
    await expect(page.getByText('Active Snap Index: 2')).toBeVisible()

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 100, slowly: true })
    await waitForAnimationEnd(page)

    await expect(page.getByText('Active Snap Index: 1')).toBeVisible()
    await expect(drawer).toBeVisible()
  })
})

test.describe('SnapPointsWithDisableDragDismiss', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--snap-points-with-disable-drag-dismiss'))
  })

  async function openDrawerAtLowestSnap(page: Page) {
    const drawer = await openDrawer(page)
    await page.getByRole('button', { name: '50%' }).click()
    await waitForAnimationEnd(page)
    return drawer
  }

  test.describe('dragging far below the lowest snap point does not close the drawer', () => {
    test('at lowest snap point (50%)', async ({ page }) => {
      const drawer = await openDrawerAtLowestSnap(page)

      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 400, slowly: true })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })

    test('at highest snap point (100%)', async ({ page }) => {
      const drawer = await openDrawer(page)

      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 400, slowly: true })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })

  test.describe('a fast flick down does not close the drawer', () => {
    test('at lowest snap point (50%)', async ({ page }) => {
      const drawer = await openDrawerAtLowestSnap(page)

      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 500, steps: 2 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })

    test('at highest snap point (100%)', async ({ page }) => {
      const drawer = await openDrawer(page)

      const handle = drawer.getByTestId('drag-handle')
      await drag(page, handle, { deltaY: 500, steps: 2 })
      await waitForAnimationEnd(page)

      await expect(drawer).toBeVisible()
    })
  })
})

test.describe('ScrollableContent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--scrollable-content'))
  })

  test('dragging the scrollable area while scrolled does not dismiss the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const scrollable = drawer.getByTestId('scrollable-content')
    await scrollable.evaluate((el) => {
      el.scrollTop = 10
    })

    await drag(page, scrollable, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('dragging the scrollable area at scroll top dismisses the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const scrollable = drawer.getByTestId('scrollable-content')
    await scrollable.evaluate((el) => {
      el.scrollTop = 0
    })

    await drag(page, scrollable, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('dragging the handle dismisses the drawer regardless of scroll position', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const scrollable = drawer.getByTestId('scrollable-content')
    await scrollable.evaluate((el) => {
      el.scrollTop = 10
    })

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })
})

test.describe('NoDragZone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--no-drag-zone'))
  })

  test('dragging on the no-drag zone has no effect on the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)
    const transformBefore = await getStyleValue(drawer, 'transform')
    expect(transformBefore).toBe(
      'translateX(0px) translateY(0px) translateZ(0px)',
    )

    const locator = drawer.getByTestId('no-drag')
    const gesture = await dragStart(page, locator)
    await gesture.move({ deltaY: 100 })

    const transformAfter = await getStyleValue(drawer, 'transform')
    expect(transformAfter).toBe(
      'translateX(0px) translateY(0px) translateZ(0px)',
    )

    await gesture.up()
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('dragging outside the no-drag zone dismisses the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })
})

test.describe('FormElements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl('drawer--form-elements'))
  })

  test('dragging a text input does not dismiss the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const input = page.getByTestId('text-input')
    await expect(input).toBeVisible()
    input.focus()
    await drag(page, input, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('dragging a textarea does not dismiss the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    const textarea = page.getByTestId('textarea')
    await expect(textarea).toBeVisible()
    textarea.focus()
    await drag(page, textarea, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('dragging a select does not dismiss the drawer', async ({ page }) => {
    const drawer = await openDrawer(page)

    const select = page.getByTestId('select')
    await expect(select).toBeVisible()
    select.focus()
    await drag(page, select, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })

  test('dragging a contentEditable element does not dismiss the drawer', async ({
    page,
  }) => {
    const drawer = await openDrawer(page)

    const el = page.getByTestId('content-editable')
    await expect(el).toBeVisible()
    await el.focus()
    await drag(page, el, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).toBeVisible()
  })
})
