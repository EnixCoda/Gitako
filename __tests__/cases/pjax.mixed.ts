import { patientClick, selectFileTreeItem, sleep, waitForLegacyPJAXRedirect } from '../utils'

describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako/src'))

  it('should work with PJAX', async () => {
    await sleep(3000)

    await patientClick(page, selectFileTreeItem('src/analytics.ts'))
    await waitForLegacyPJAXRedirect()

    await page.click('a[data-tab-item="issues-tab"]')
    await waitForLegacyPJAXRedirect()

    await page.click('a[data-tab-item="pull-requests-tab"]')
    await waitForLegacyPJAXRedirect()

    page.goBack()
    await waitForLegacyPJAXRedirect()
    await sleep(1000)

    page.goBack()
    await waitForLegacyPJAXRedirect()
    await sleep(1000)

    expect(
      await page.evaluate(
        () => document.querySelector('.final-path')?.textContent === 'analytics.ts',
      ),
    ).toBe(true)
  })
})
