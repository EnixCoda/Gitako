import { expectToFind, expectToNotFind, sleep, waitForLegacyPJAXRedirect } from '../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/commits/develop'))

  it('should not break go back in history', async () => {
    for (let i = 0; i < 3; i++) {
      const commitLinks = await page.$$(
        `#js-repo-pjax-container .TimelineItem-body ol li > div:nth-child(1) a[href*="/commit/"]`,
      )
      if (commitLinks.length < 2) throw new Error(`No enough commits`)
      commitLinks[i].click()
      await waitForLegacyPJAXRedirect()
      await expectToFind('div.commit')
      await sleep(1000)

      page.goBack()
      await sleep(1000)
      // The selector for file content
      await expectToNotFind('div.commit')
    }
  })
})
