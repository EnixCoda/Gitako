import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { sleep, waitForRedirect } from './utils'

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/develop/src`)
  })

  test('should not break go back in history', async ({ extensionPage }) => {
    for (let i = 0; i < 3; i++) {
      const fileItems = await extensionPage.locator(selectors.github.fileListItemFileLinks).all()
      if (fileItems.length < 2) throw new Error(`No enough files`)

      await waitForRedirect(extensionPage, async () => {
        await fileItems[i].click()
      })
      await expect(extensionPage.locator(selectors.github.fileContent)).toBeVisible({
        timeout: 5000,
      })
      await sleep(1000)

      await extensionPage.goBack()
      await sleep(1000)
      // The selector for file content should not be visible
      await expect(extensionPage.locator(selectors.github.fileContent)).not.toBeVisible({
        timeout: 2000,
      })
    }
  })
})
