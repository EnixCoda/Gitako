import { expectToFind, selectFileTreeItem, sleep, waitForRedirect } from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('expand to target on load and after redirect', async () => {
    await sleep(3000)

    // Expect Gitako sidebar to have expanded src to see contents
    await expectToFind(selectFileTreeItem('src/components'))

    await page.click(
      `.js-details-container div[role="row"] div[role="rowheader"] [title="components"]`,
    )
    await waitForRedirect()

    // Expect Gitako sidebar to have expanded components and see contents
    await expectToFind(selectFileTreeItem('src/components/Gitako.tsx'))
  })
})
