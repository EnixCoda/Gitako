/**
 * Confirm basic behaviors of playwright assertions
 */

import { expect, test } from './fixtures'
import { testURL } from './testURL'

test.describe('in random page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://google.com`)
  })

  test('wait for hidden non-exist element should resolve null', async ({ extensionPage }) => {
    await expect(extensionPage.locator('.non-exist-element')).toHaveCount(0)
  })

  test('wait for exist element', async ({ extensionPage }) => {
    await expect(extensionPage.locator('*').first()).toBeVisible()
  })

  test('wait for non-exist element should not be visible', async ({ extensionPage }) => {
    await expect(extensionPage.locator('.non-exist-element')).not.toBeVisible()
  })

  test('wait for non-exist element should timeout', async ({ extensionPage }) => {
    await expect(async () => {
      await extensionPage.waitForSelector('.non-exist-element', { timeout: 1000 })
    }).rejects.toThrow()
  })
})
