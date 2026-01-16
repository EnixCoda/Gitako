import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { expandFloatModeSidebar, patientClick, sleep, waitForRedirect } from './utils'

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/test/multiple-changes`)
  })

  test('should work with PJAX', async ({ extensionPage }) => {
    await sleep(3000)

    await expandFloatModeSidebar(extensionPage)
    await patientClick(extensionPage, selectors.gitako.fileItemOf('.babelrc'))
    await waitForRedirect(extensionPage)

    await expect(extensionPage.locator(selectors.github.fileContent)).toBeVisible({ timeout: 5000 })

    await waitForRedirect(extensionPage, async () => {
      await sleep(1000) // This prevents failing in some cases due to some mystery scheduling issue
      await extensionPage.goBack()
    })

    // The selector for file content should not be visible
    await expect(extensionPage.locator(selectors.github.fileContent)).not.toBeVisible({
      timeout: 2000,
    })
  })
})
