import {
  expandFloatModeSidebar,
  expectToFind,
  expectToNotFind,
  patientClick,
  selectFileTreeItem,
  sleep,
  waitForPJAXAPIRedirect
} from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await expandFloatModeSidebar()
    await patientClick(selectFileTreeItem('.babelrc'))
    await waitForPJAXAPIRedirect()

    // The selector for file content
    await expectToFind('table.js-file-line-container')

    page.goBack()
    await waitForPJAXAPIRedirect()

    // The selector for file content
    await expectToNotFind('table.js-file-line-container')

    // await waitForPJAXAPIRedirect()
  })
})
