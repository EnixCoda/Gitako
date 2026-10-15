import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { ensureSidebarExpanded } from './sidebar'
import { collapseFloatModeSidebar, sleep } from './utils'
import { testURL } from './testURL'

async function navigateAndWait(
  page: Page,
  action: () => Promise<unknown>,
  expectedURL: string,
  ready: () => Promise<unknown>,
) {
  await page.evaluate(() => {
    const navigationWindow = window as typeof window & {
      __gitakoE2ENavigationSettled?: Promise<void>
    }
    navigationWindow.__gitakoE2ENavigationSettled = new Promise<void>(resolve => {
      const finish = () => {
        document.removeEventListener('turbo:load', finish)
        document.removeEventListener('pjax:end', finish)
        resolve()
      }
      document.addEventListener('turbo:load', finish)
      document.addEventListener('pjax:end', finish)
    })
  })
  const settled = page
    .evaluate(
      () =>
        (
          window as typeof window & {
            __gitakoE2ENavigationSettled?: Promise<void>
          }
        ).__gitakoE2ENavigationSettled,
    )
    // A true full-page navigation destroys the old execution context instead
    // of delivering a Turbo/PJAX event. In that case load-state is the settled
    // signal; the destination-specific assertion below is still authoritative.
    .catch(() => page.waitForLoadState('domcontentloaded'))
  await Promise.all([page.waitForURL(expectedURL, { timeout: 15000 }), action()])
  // The settle promise listens for turbo:load / pjax:end inside the page. A
  // navigation GitHub implements differently (e.g. a React-route change that
  // fires neither event) would otherwise hang the test forever, so bound it:
  // the destination-specific assertion below is always the authority.
  await Promise.race([settled, sleep(15000)])
  await ready()
}

test.describe('in Gitako project page', () => {
  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/develop/src`)
  })

  test('should work with PJAX', async ({ extensionPage }) => {
    await expect(extensionPage.locator(selectors.gitako.toggleButton)).toBeAttached({
      timeout: 15000,
    })
    await ensureSidebarExpanded(extensionPage)

    const analytics = extensionPage.locator(selectors.gitako.fileItemOf('src/analytics.ts'))
    await expect(analytics).toBeVisible({ timeout: 15000 })
    await navigateAndWait(
      extensionPage,
      () => analytics.click(),
      '**/blob/develop/src/analytics.ts',
      () =>
        expect(extensionPage.locator(selectors.github.breadcrumbFileName).first()).toHaveText(
          '/analytics.ts',
        ),
    )
    await collapseFloatModeSidebar(extensionPage)

    await navigateAndWait(
      extensionPage,
      () => extensionPage.locator(selectors.github.navBarItemIssues).click(),
      '**/issues',
      // Human landing signal: the issues search box. GitHub's issues page title
      // is an <h1>Issues</h1> but there are several "Issues" headings and the
      // first one in DOM order is hidden, so use the visible search input.
      () => expect(extensionPage.getByPlaceholder('Search issues').first()).toBeVisible(),
    )

    await navigateAndWait(
      extensionPage,
      () => extensionPage.locator(selectors.github.navBarItemPulls).click(),
      '**/pulls',
      () =>
        expect(
          extensionPage.getByRole('heading', { name: /Pull requests/i }).first(),
        ).toBeVisible(),
    )

    await navigateAndWait(
      extensionPage,
      () => extensionPage.goBack(),
      '**/issues',
      () => expect(extensionPage.getByPlaceholder('Search issues').first()).toBeVisible(),
    )
    await navigateAndWait(
      extensionPage,
      () => extensionPage.goBack(),
      '**/blob/develop/src/analytics.ts',
      () =>
        expect(extensionPage.locator(selectors.github.breadcrumbFileName).first()).toHaveText(
          '/analytics.ts',
        ),
    )
  })
})
