import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import {
  collapseFloatModeSidebar,
  expandFloatModeSidebar,
  getTextContent,
  patientClick,
  sleep,
  waitForRedirect,
} from './utils'

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/develop/src`)
  })

  test('should work with PJAX', async ({ extensionPage }) => {
    await sleep(3000)

    await expandFloatModeSidebar(extensionPage)
    await patientClick(extensionPage, selectors.gitako.fileItemOf('src/analytics.ts'))
    await waitForRedirect(extensionPage)
    await collapseFloatModeSidebar(extensionPage)

    await extensionPage.click(selectors.github.navBarItemIssues)
    await waitForRedirect(extensionPage)

    await extensionPage.click(selectors.github.navBarItemPulls)
    await waitForRedirect(extensionPage)

    await extensionPage.goBack()
    await sleep(1000)

    await extensionPage.goBack()
    await sleep(1000)

    const textContent = await getTextContent(extensionPage, selectors.github.breadcrumbFileName)
    expect(textContent).toBe('/analytics.ts')
  })
})
