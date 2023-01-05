import { getTextContent, sleep } from '../../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/GitakoExtension/test-empty'))

  it('should render error message', async () => {
    await sleep(5000)

    expect(await getTextContent('#gitako-logo-mount-point .error-message')).toBe(
      'This project seems to be empty.',
    )
  })
})
