import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { sleep, waitForRedirect } from './utils'

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/develop/src`)
  })

  test('expand to target on load and after redirect', async ({ extensionPage }) => {
    await sleep(3000)

    // Expect Gitako sidebar to have expanded src to see contents
    await expect(extensionPage.locator(selectors.gitako.fileItemOf('src/components'))).toBeVisible({
      timeout: 5000,
    })

    await extensionPage.click(selectors.github.fileListItemLinkOf('components'))
    await waitForRedirect(extensionPage)

    // Expect Gitako sidebar to have expanded components and see contents
    await expect(
      extensionPage.locator(selectors.gitako.fileItemOf('src/components/Gitako.tsx')),
    ).toBeVisible({ timeout: 5000 })
  })
})
