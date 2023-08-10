import { selectors } from '../../selectors'
import {
  collapseFloatModeSidebar,
  expandFloatModeSidebar,
  getTextContent,
  patientClick,
  sleep,
  waitForRedirect,
} from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await expandFloatModeSidebar()
    await patientClick(selectors.gitako.fileItemOf('src/analytics.ts'))
    await waitForRedirect()
    await collapseFloatModeSidebar()

    await page.click(selectors.github.navBarItemIssues)
    await waitForRedirect()

    await page.click(selectors.github.navBarItemPulls)
    await waitForRedirect()

    page.goBack()
    await sleep(1000)

    page.goBack()
    await sleep(1000)

    expect(await getTextContent(selectors.github.breadcrumbFileName)).toBe('analytics.ts')
  })
})
