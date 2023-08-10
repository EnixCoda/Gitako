import { selectors } from '../../selectors'
import { expandFloatModeSidebar, expectToFind, expectToNotFind, scroll } from '../../utils'

jest.retryTimes(3)

describe(`in Gitako project page`, () => {
  beforeAll(() =>
    page.goto('https://github.com/EnixCoda/Gitako/tree/test/200-changed-files-200-lines-each'),
  )

  it('should render Gitako', async () => {
    await expectToFind(selectors.gitako.bodyWrapper)
  })

  it('should render file list', async () => {
    await expectToFind(selectors.gitako.fileItem)
  })

  it('should render while scroll', async () => {
    await expandFloatModeSidebar()

    const filesEle = await page.waitForSelector(selectors.gitako.files)
    // node of tsconfig.json should NOT be rendered before scroll down
    await expectToNotFind(selectors.gitako.fileItemOf('tsconfig.json'))
    const box = await filesEle?.boundingBox()
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40)
      await scroll({ totalDistance: 10000, stepDistance: 100 })

      // node of tsconfig.json should be rendered now
      await expectToFind(selectors.gitako.fileItemOf('tsconfig.json'))
    }
  })
})
