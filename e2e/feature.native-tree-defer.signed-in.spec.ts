import { expect, resolveProfilePath, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'

// When GitHub shows its own code-view file tree, Gitako (persistent + auto)
// defers to it and stays collapsed so two trees don't stack. The
// `deferToNativeFileTree` config lets the user turn that off: with it disabled,
// Gitako keeps its sidebar open even while GitHub shows its own tree.
test.describe('feature: defer to GitHub native file tree (signed-in)', () => {
  test.skip(!resolveProfilePath(), "GitHub's native file tree requires a signed-in profile")

  test('collapses when deferring (default); stays expanded with defer off', async ({
    extensionPage,
  }) => {
    // Wide enough that GitHub renders the code-view file tree (it hides below a
    // width breakpoint), same precondition as feature.auto-collapse-hint.
    await extensionPage.setViewportSize({ width: 1920, height: 1080 })

    const nativeTreeReallyShown = () =>
      extensionPage.evaluate(() => {
        const el = document.querySelector('#repos-file-tree')
        if (!el) return false
        const { width, height } = el.getBoundingClientRect()
        return width * height > 0
      })
    const barExpanded = () =>
      extensionPage.evaluate(() => {
        const el = document.querySelector('.gitako-side-bar-body-wrapper')
        return !(el?.className || '').includes('collapsed')
      })

    // Default (deferToNativeFileTree unset → true): Gitako defers to the
    // native tree, so the pinned bar stays collapsed.
    await extensionPage.goto(
      testURL`https://github.com/EnixCoda/Gitako/blob/develop/README.md?gitako-config-sidebarToggleMode=%22persistent%22&gitako-config-intelligentToggle=null`,
    )
    const nativeShown = await expect
      .poll(nativeTreeReallyShown, { timeout: 15000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false)
    test.skip(!nativeShown, 'GitHub native code-view file tree not shown (drift / narrow)')
    await expect(extensionPage.locator(selectors.gitako.collapsedBodyWrapper)).toBeAttached()

    // deferToNativeFileTree=false: Gitako ignores the native tree and expands.
    await extensionPage.goto(
      testURL`https://github.com/EnixCoda/Gitako/blob/develop/README.md?gitako-config-sidebarToggleMode=%22persistent%22&gitako-config-intelligentToggle=null&gitako-config-deferToNativeFileTree=false`,
    )
    await expect.poll(barExpanded, { timeout: 15000 }).toBe(true)
    await expect(extensionPage.locator(selectors.gitako.bodyWrapper)).toBeAttached()
  })
})
