import { expectToFind } from '../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/pull/71'))

  it('should render Gitako', async () => {
    await expectToFind('.gitako-side-bar .gitako-side-bar-body-wrapper')
  })

  it('should render file list', async () => {
    await expectToFind('.gitako-side-bar .files .node-item')
  })
})
