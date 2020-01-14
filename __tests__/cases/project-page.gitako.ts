import { expectToFind } from '../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako'))

  it('should render Gitako', async () => {
    expectToFind('.gitako-side-bar .gitako-position-wrapper')
  })
})
