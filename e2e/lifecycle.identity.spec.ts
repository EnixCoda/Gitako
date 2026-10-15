import { expect, expectNoGitakoPageErrors, test } from './fixtures'
import {
  assertGitakoMounted,
  assertNoOrphanRoot,
  assertRootIdentityPreserved,
  stampRootIdentity,
} from './lifecycle'
import { testURL } from './testURL'

/**
 * Locks in the bug class we just fixed: Turbo replaces <body> on
 * cross-page navigation; our cached gitako-root must (a) survive as
 * the same JS object and (b) be re-attached to the live document by
 * MountPointWatcher. Catches both the original "Gitako disappears"
 * regression and the latent styled-components-orphan subclass.
 *
 * Navigation is driven through Turbo.visit explicitly rather than UI
 * clicks. GitHub's nav-tab clicks on anonymous pages can fall back to
 * a hard reload (resetting `window`), which would invalidate the
 * stamped reference for reasons unrelated to the invariant being
 * tested. Programmatic Turbo.visit forces the Turbo path on both
 * auth modes so the test exercises the same lifecycle uniformly.
 * (This is an *essential* script-based step: the invariant under test —
 * Gitako's root surviving Turbo's `body` swap — only exists at the
 * implementation level and only when soft-navigation is available.
 * We still verify the human flow separately and only ever skip (never
 * false-fail) when GitHub isn't soft-navigating, e.g. at the
 * all-ON-off Feature-Preview floor.)
 */

/**
 * Whether GitHub is soft-navigating on this page (Turbo present). At the
 * all-OFF Feature-Preview floor GitHub serves a legacy render with full page
 * loads and no Turbo, so the body-swap invariant can't be exercised there —
 * the spec skips honestly instead of waiting on a global that never appears.
 */
async function softNavigationAvailable(page: import('@playwright/test').Page): Promise<boolean> {
  return page
    .evaluate(() => typeof (window as unknown as { Turbo?: unknown }).Turbo !== 'undefined')
    .catch(() => false)
}

async function turboVisit(page: import('@playwright/test').Page, url: string) {
  // Turbo presence was checked before entering the sequence; this waits only
  // for the bundle to finish binding the visit method, not for it to appear.
  await page.waitForFunction(
    () => typeof (window as unknown as { Turbo: { visit?: unknown } }).Turbo?.visit === 'function',
    undefined,
    { timeout: 10000 },
  )
  await page.evaluate(target => {
    ;(window as unknown as { Turbo: { visit: (u: string) => void } }).Turbo.visit(target)
  }, url)
}

/**
 * Wait for a Turbo nav to settle before the one-shot structural asserts run.
 * Deliberately does NOT use waitForURL's default `waitUntil: 'load'` — the
 * repo overview can take >10s to fire `load` under nightly load, which flaked
 * this test even though the nav itself completed. Instead: poll the (pushState-
 * updated) URL, then wait for the content script to re-attach #gitako-root
 * after Turbo's body swap (plus the SideBar on pages where Gitako is visible),
 * which is exactly the state the asserts below snapshot.
 */
async function waitSettled(
  page: import('@playwright/test').Page,
  urlMatch: (url: string) => boolean,
  visible: boolean,
) {
  await expect
    .poll(() => urlMatch(page.url()), { message: 'Turbo nav settled', timeout: 20000 })
    .toBe(true)
  await page.waitForFunction(
    vis => {
      const root = document.querySelector('#gitako-root')
      if (!root || !root.isConnected) return false
      if (vis && document.querySelectorAll('.gitako-side-bar').length < 1) return false
      return true
    },
    visible,
    { timeout: 20000 },
  )
}

test.describe('lifecycle: root identity', () => {
  test('#gitako-root JS identity survives Turbo body-swap sequence', async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako`)
    await expect(extensionPage.locator('.gitako-toggle-show-button')).toBeVisible({
      timeout: 10000,
    })
    test.skip(
      !(await softNavigationAvailable(extensionPage)),
      'Turbo soft-navigation not active on this floor; body-swap invariant not exercisable',
    )
    await stampRootIdentity(extensionPage)
    await assertGitakoMounted(extensionPage, 'initial overview')

    // overview -> /tree/v3 via Turbo
    await turboVisit(extensionPage, '/EnixCoda/Gitako/tree/v3')
    await waitSettled(extensionPage, u => u.includes('/tree/v3'), true)
    await assertGitakoMounted(extensionPage, 'after Turbo to tree/v3')
    await assertRootIdentityPreserved(extensionPage, 'after Turbo to tree/v3')
    await assertNoOrphanRoot(extensionPage, 'after Turbo to tree/v3')

    // tree/v3 -> /issues (Gitako should not be VISIBLE here, but the
    // root element and our JS reference must still be the same)
    await turboVisit(extensionPage, '/EnixCoda/Gitako/issues')
    await waitSettled(extensionPage, u => u.includes('/issues'), false)
    await assertRootIdentityPreserved(extensionPage, 'after Turbo to issues')
    await assertNoOrphanRoot(extensionPage, 'after Turbo to issues')

    // /issues -> /tree/v3 (Turbo nav, not goBack — goBack on the cached
    // /issues snapshot can collapse back into a hard reload on some auth
    // states; Turbo.visit keeps the path uniform)
    await turboVisit(extensionPage, '/EnixCoda/Gitako/tree/v3')
    await waitSettled(extensionPage, u => u.includes('/tree/v3'), true)
    await assertGitakoMounted(extensionPage, 'back to tree/v3')
    await assertRootIdentityPreserved(extensionPage, 'back to tree/v3')
    await assertNoOrphanRoot(extensionPage, 'back to tree/v3')

    // back to overview
    await turboVisit(extensionPage, '/EnixCoda/Gitako')
    await waitSettled(extensionPage, u => /\/EnixCoda\/Gitako(?:[?#]|$)/.test(u), true)
    await assertGitakoMounted(extensionPage, 'back to overview')
    await assertRootIdentityPreserved(extensionPage, 'back to overview')
    await assertNoOrphanRoot(extensionPage, 'back to overview')

    // No uncaught exceptions from extension code during the whole sequence.
    expectNoGitakoPageErrors(extensionPage)
  })
})
