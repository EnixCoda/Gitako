import { selectors } from '../../selectors'
import {
  expandFloatModeSidebar,
  expectToFind,
  expectToNotFind,
  patientClick,
  sleep,
  waitForRedirect,
} from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/test/multiple-changes'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await expandFloatModeSidebar()
    await patientClick(selectors.gitako.fileItemOf('.babelrc'))
    await waitForRedirect()

    await expectToFind(selectors.github.fileContent)

    await waitForRedirect(async () => {
      await sleep(1000) // This prevents failing in some cases due to some mystery scheduling issue of puppeteer or jest
      page.goBack()
    })

    // The selector for file content
    await expectToNotFind(selectors.github.fileContent)
  })
})
