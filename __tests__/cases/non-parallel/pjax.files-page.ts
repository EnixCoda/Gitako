import { selectors } from '../../selectors'
import { expectToFind, expectToNotFind, sleep, waitForRedirect } from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('should not break go back in history', async () => {
    for (let i = 0; i < 3; i++) {
      const fileItems = await page.$$(selectors.github.fileListItemFileLinks)
      if (fileItems.length < 2) throw new Error(`No enough files`)

      await waitForRedirect(async () => {
        await fileItems[i].click()
      })
      await expectToFind(selectors.github.fileContent)
      await sleep(1000)

      page.goBack()
      await sleep(1000)
      // The selector for file content

      await expectToNotFind(selectors.github.fileContent)
    }
  })
})
