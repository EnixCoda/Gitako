import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'

test.describe('in Gitako pull request page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/pull/71`)
  })

  test('should render Gitako', async ({ extensionPage }) => {
    await expect(extensionPage.locator(selectors.gitako.bodyWrapper)).toBeVisible({ timeout: 5000 })
  })

  test('should render file list', async ({ extensionPage }) => {
    await expect(extensionPage.locator(selectors.gitako.fileItem).first()).toBeVisible({
      timeout: 5000,
    })
  })
})
