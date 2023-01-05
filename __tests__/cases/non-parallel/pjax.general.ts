import {
  collapseFloatModeSidebar,
  expandFloatModeSidebar,
  getTextContent,
  patientClick,
  selectFileTreeItem,
  sleep,
  waitForRedirect,
} from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await expandFloatModeSidebar()
    await patientClick(selectFileTreeItem('src/analytics.ts'))
    await waitForRedirect()
    await collapseFloatModeSidebar()

    await page.click('a[data-selected-links^="repo_issues "]')
    await waitForRedirect()

    await page.click('a[data-selected-links^="repo_pulls "]')
    await waitForRedirect()

    page.goBack()
    await sleep(1000)

    page.goBack()
    await sleep(1000)

    expect(await getTextContent('.final-path')).toBe('analytics.ts')
  })
})
