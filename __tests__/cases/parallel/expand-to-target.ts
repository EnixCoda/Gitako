import { selectors } from '../../selectors'
import { expectToFind, sleep, waitForRedirect } from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/develop/src'))

  it('expand to target on load and after redirect', async () => {
    await sleep(3000)

    // Expect Gitako sidebar to have expanded src to see contents
    await expectToFind(selectors.gitako.fileItemOf('src/components'))

    await page.click(selectors.github.fileListItemOf('components'))
    await waitForRedirect()

    // Expect Gitako sidebar to have expanded components and see contents
    await expectToFind(selectors.gitako.fileItemOf('src/components/Gitako.tsx'))
  })
})
