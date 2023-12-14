import { selectors } from '../../selectors'
import { testURL } from '../../testURL'
import { expectToFind } from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto(testURL`https://github.com/EnixCoda/Gitako/pull/71`))

  it('should render Gitako', async () => {
    await expectToFind(selectors.gitako.bodyWrapper)
  })

  it('should render file list', async () => {
    await expectToFind(selectors.gitako.fileItem)
  })
})
