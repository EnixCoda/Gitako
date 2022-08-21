import {
  expandFloatModeSidebar,
  expectToFind,
  expectToNotFind,
  patientClick,
  selectFileTreeItem,
  sleep,
  waitForRedirect,
} from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/tree/test/multiple-changes'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await expandFloatModeSidebar()
    await patientClick(selectFileTreeItem('.babelrc'))
    await waitForRedirect()

    // The selector for file content
    await expectToFind('table.js-file-line-container')

    await waitForRedirect(async () => {
      await sleep(1000) // This prevents failing in some cases due to some mystery scheduling issue of puppeteer or jest
      page.goBack()
    })

    // The selector for file content
    await expectToNotFind('table.js-file-line-container')
  })
})
