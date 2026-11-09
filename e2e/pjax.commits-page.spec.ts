import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { clickAndWaitForURL, sleep } from './utils'

test.describe('in Gitako commits page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/commits/develop`)
  })

  test('should not break go back in history', async ({ extensionPage }) => {
    for (let i = 0; i < 3; i++) {
      const commitLinks = await extensionPage.locator(selectors.github.commitLinks).all()
      if (commitLinks.length < 2) throw new Error(`No enough commits`)

      // GitHub's commits list is rendered client-side: on a slow render the
      // first click can land before the app is interactive and be swallowed.
      // The helper re-clicks, exactly as a user would, until the commit page
      // actually opens.
      await clickAndWaitForURL(extensionPage, commitLinks[i], /\/commit\/[0-9a-f]{7,}/)
      await expect(extensionPage.locator(selectors.github.commitPage).first()).toBeVisible({
        timeout: 5000,
      })
      await sleep(1000)

      await extensionPage.goBack()
      await sleep(1000)
      // The selector for commit page should not be visible
      await expect(extensionPage.locator(selectors.github.commitPage)).not.toBeVisible({
        timeout: 2000,
      })
    }
  })
})
