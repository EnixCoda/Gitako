import { selectors } from '../../selectors'
import { testURL } from '../../testURL'
import { getTextContent, sleep } from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto(testURL`https://github.com/GitakoExtension/test-empty`))

  it('should render error message', async () => {
    await sleep(5000)

    expect(await getTextContent(selectors.gitako.errorMessage)).toBe(
      'This project seems to be empty.',
    )
  })
})
