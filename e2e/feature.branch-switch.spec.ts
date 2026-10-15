import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { clickRepoNavTab, switchBranchViaPicker, waitForRedirect } from './utils'

// Repro for: starting on the repo overview, switching branches via the
// GitHub branch picker, then navigating away and back, leaves Gitako's
// sidebar detached — the toggle icon never reappears.
//
// The branch switch is driven through the real branch-picker dialog and the
// repo-nav tab is clicked, exactly as a user does — not via GitHub's Turko
// internals (Turbo.visit), because the user-visible outcome is what matters
// and GitHub only soft-navigates when its modern Feature-Preview cohort is
// enabled (at all-OFF it does a full page load instead).
test.describe('branch switch lifecycle', () => {
  test('Gitako sidebar survives overview -> branch -> issues -> back', async ({
    extensionPage,
  }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako`)
    await expect(extensionPage.locator('.gitako-toggle-show-button')).toBeVisible({
      timeout: 10000,
    })

    // Human branch switch: open the branch picker from the overview and pick v3.
    await switchBranchViaPicker(extensionPage, 'v3')
    await extensionPage.waitForURL('**/tree/v3', { timeout: 10000 })
    await expect(extensionPage.locator(selectors.gitako.branchName)).toHaveText('v3', {
      timeout: 10000,
    })

    await waitForRedirect(extensionPage, async () => {
      await clickRepoNavTab(extensionPage, 'Issues')
    })

    await waitForRedirect(extensionPage, async () => {
      await extensionPage.goBack()
    })

    await expect(extensionPage.locator('.gitako-toggle-show-button')).toBeVisible({
      timeout: 10000,
    })
  })
})
