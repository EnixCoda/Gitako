import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { expandFloatModeSidebar, scroll } from './utils'

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(
      testURL`https://github.com/EnixCoda/Gitako/tree/test/200-changed-files-200-lines-each`,
    )
  })

  test('should render Gitako', async ({ extensionPage }) => {
    await expect(extensionPage.locator(selectors.gitako.bodyWrapper)).toBeVisible({ timeout: 5000 })
  })

  test('should render file list', async ({ extensionPage }) => {
    await expect(extensionPage.locator(selectors.gitako.fileItem).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('should render while scroll', async ({ extensionPage }) => {
    await expandFloatModeSidebar(extensionPage)

    await extensionPage.waitForSelector(selectors.gitako.files)
    // node of tsconfig.json should NOT be rendered before scroll down
    await expect(
      extensionPage.locator(selectors.gitako.fileItemOf('tsconfig.json')),
    ).not.toBeVisible({
      timeout: 2000,
    })

    const filesEle = extensionPage.locator(selectors.gitako.files)
    const box = await filesEle.boundingBox()
    if (box) {
      await extensionPage.mouse.move(box.x + 40, box.y + 40)
      await scroll(extensionPage, { totalDistance: 10000, stepDistance: 100 })

      // node of tsconfig.json should be rendered now
      await expect(extensionPage.locator(selectors.gitako.fileItemOf('tsconfig.json'))).toBeVisible(
        { timeout: 5000 },
      )
    }
  })
})
