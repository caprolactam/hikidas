import { test, expect } from '@playwright/test'
import { drag, storyUrl, waitForAnimationEnd } from '../utils'

test.beforeEach(async ({ page }) => {
  await page.goto(storyUrl('adapters-headless-ui--default'))
})

test.describe('Headless UI smoke', () => {
  test('renders and responds to interactions', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    const drawer = page.getByTestId('drawer')
    await expect(drawer).toBeVisible()

    await drawer.getByRole('button', { name: 'Close' }).click()
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })

  test('close by dragging', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Drawer' }).click()
    await waitForAnimationEnd(page)

    const drawer = page.getByTestId('drawer')
    await expect(drawer).toBeVisible()

    const handle = drawer.getByTestId('drag-handle')
    await drag(page, handle, { deltaY: 200 })
    await waitForAnimationEnd(page)

    await expect(drawer).not.toBeVisible()
  })
})
