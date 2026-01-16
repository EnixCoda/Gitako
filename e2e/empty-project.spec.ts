import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { getTextContent, sleep } from './utils'

test.describe('in Gitako empty project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/GitakoExtension/test-empty`)
  })

  test('should render error message', async ({ extensionPage }) => {
    await sleep(5000)

    const textContent = await getTextContent(extensionPage, selectors.gitako.errorMessage)
    expect(textContent).toBe('This project seems to be empty.')
  })
})
