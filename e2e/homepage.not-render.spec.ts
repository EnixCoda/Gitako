import { expect, test } from './fixtures'
import { testURL } from './testURL'

test.describe('in GitHub homepage', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com`)
  })

  test('should not render Gitako', async ({ extensionPage }) => {
    await expect(
      extensionPage.locator('.gitako-side-bar .gitako-side-bar-body-wrapper'),
    ).not.toBeVisible({ timeout: 2000 })
  })
})
