import { selectors } from '../../selectors'
import { testURL } from '../../testURL'
import { expectToFind, expectToNotFind, sleep, waitForRedirect } from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto(testURL`https://github.com/EnixCoda/Gitako/commits/develop`))

  it('should not break go back in history', async () => {
    for (let i = 0; i < 3; i++) {
      const commitLinks = await page.$$(selectors.github.commitLinks)
      if (commitLinks.length < 2) throw new Error(`No enough commits`)
      commitLinks[i].click()
      await waitForRedirect()
      await expectToFind(selectors.github.commitSummary)
      await sleep(1000)

      page.goBack()
      await sleep(1000)
      // The selector for file content
      await expectToNotFind(selectors.github.commitSummary)
    }
  })
})
