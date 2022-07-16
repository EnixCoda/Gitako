import {
  expectToFind,
  expectToNotFind,
  sleep, waitForRedirect
} from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('should not break go back in history', async () => {
    for (let i = 0; i < 3; i++) {
      const commitLinks = await page.$$(
        `.js-details-container div[role="row"] div[role="rowheader"] a[title*="."]`,
      )
      if (commitLinks.length < 2) throw new Error(`No enough files`)
      await waitForRedirect(async () => {
        await commitLinks[i].click()
      })
      await expectToFind('table.js-file-line-container')
      await sleep(1000)

      page.goBack()
      await sleep(1000)
      // The selector for file content
      await expectToNotFind('table.js-file-line-container')
    }
  })
})
