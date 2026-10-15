import { expect, resolveProfilePath, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { expandFloatModeSidebar, switchBranchViaPicker } from './utils'

/**
 * Branch switch must refetch the file tree, not just update the
 * displayed branch name. Existing feature.branch-switch.spec.ts verifies
 * Gitako survives the Turbo nav and the branch-name label flips;
 * this spec adds the contract that the file LIST also reflects the
 * new ref. Failure mode: branch-name updates but tree contents stay
 * stale (a likely failure when the meta-resolution path and
 * tree-fetch path diverge).
 */

async function capturePjxFileNames(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(sel => {
    return Array.from(document.querySelectorAll(sel)).map(
      e => (e as HTMLElement).getAttribute('title') || '',
    )
  }, selectors.gitako.fileItem)
}

test.describe('navigation: branch switch refetches tree', () => {
  // Needs file tree fetch (signed-in profile carries the token). See note
  // in ui.search.spec.ts.
  test.skip(
    !resolveProfilePath(),
    'no persistent profile configured; Gitako cannot fetch the file tree to compare',
  )

  test('file list differs between branches with different content', async ({ extensionPage }) => {
    await extensionPage.goto(testURL`https://github.com/EnixCoda/Gitako/tree/develop`)
    await expect(extensionPage.locator(selectors.gitako.branchName)).toHaveText('develop', {
      timeout: 10000,
    })
    // In float mode (default) the body starts off-screen; expand so we
    // can read the rendered tree contents.
    await expandFloatModeSidebar(extensionPage)
    // The branch-name label flips as soon as meta resolves, but the tree
    // fetch+render lands a beat later (and slower right after a freshly minted
    // token / cold caches). Poll for a populated list rather than a fixed wait,
    // which flaked here at 500ms.
    await expect
      .poll(async () => (await capturePjxFileNames(extensionPage)).length, {
        message: 'develop file list non-empty',
        timeout: 10000,
      })
      .toBeGreaterThan(0)
    const developFiles = await capturePjxFileNames(extensionPage)

    // Human branch switch to v3 (an older branch with a substantially
    // different file layout) via the branch picker — not Turbo.visit, so it
    // works whether GitHub soft-navigates or does a full page load.
    await switchBranchViaPicker(extensionPage, 'v3')
    await extensionPage.waitForURL('**/tree/v3', { timeout: 10000 })
    await expect(extensionPage.locator(selectors.gitako.branchName)).toHaveText('v3', {
      timeout: 10000,
    })
    await expandFloatModeSidebar(extensionPage)
    // Poll until the tree has refetched: non-empty AND no longer the develop
    // list. Polling for non-empty alone could catch the stale develop tree
    // before v3 lands; requiring it to differ makes the wait detect the actual
    // refetch (and replaces the fixed 1500ms, which has the same flake shape).
    await expect
      .poll(
        async () => {
          const files = await capturePjxFileNames(extensionPage)
          return files.length > 0 && files.sort().join(',') !== developFiles.sort().join(',')
        },
        { message: 'v3 tree refetched (non-empty and differs from develop)', timeout: 10000 },
      )
      .toBe(true)
    const v3Files = await capturePjxFileNames(extensionPage)
    expect(v3Files.length, 'v3 file list non-empty').toBeGreaterThan(0)

    // The two branches' file lists must differ. If they were identical,
    // either (a) the tree didn't refetch and we're still showing develop,
    // or (b) the two branches happen to share a root layout (highly
    // unlikely for develop vs v3 — v3 predates major restructuring).
    expect(v3Files.sort().join(','), 'v3 file list differs from develop').not.toBe(
      developFiles.sort().join(','),
    )
  })
})
