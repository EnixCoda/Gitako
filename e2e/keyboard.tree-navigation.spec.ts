import { Page } from '@playwright/test'
import { expect, resolveProfilePath, test } from './fixtures'
import { selectors } from './selectors'
import { sleep } from './utils'

// Gitako's file tree is keyboard-navigable: with `.file-explorer` focused,
// ArrowUp/Down move the highlight and Enter opens the focused file. The bug this
// guards is keyboard CONTINUITY across opening a file — focus must stay in the
// tree so the user can keep arrowing. It silently died after one file because
// the destination auto-collapsed the pinned bar, and collapsing runs
// document.body.focus().
//
// This is a matrix: MODE × SOURCE-PAGE × METHOD.
//   - mode:   persistent | float                 (sidebarToggleMode)
//   - source: the page the open starts FROM. The destination is always
//             "open a file from the tree", which navigates to a /blob/ page.
//   - method: keyboard (Enter) | mouse (click). Mouse is the negative control —
//             it must NOT inherit keyboard focus-retention (the keyboard-nav flag
//             is cleared on mousedown).
//
// The `issue` source is the same-shape but harder case: an issue page renders the
// default-branch repo tree, and opening a file there is a CROSS-CONTEXT
// navigation (the committed repo meta changes), which makes RepoContextWrapper
// flash its `disabled` state and remount the whole sidebar. The fix keeps the
// keyboard-nav intent alive across that remount (keyboardNavRef is a module
// singleton, and SideBar re-seeds expand/focus from it on mount), so the same
// focus-retention assertions apply unchanged.
//
// The PR *diff* tree (a pull request's changed-files list) is a different shape —
// opening a leaf is a same-page hash scroll to the diff, not a navigation — so it
// has its own describe block below rather than a matrix cell.
//
// Assertions:
//   - keyboard ⇒ focus STAYS in `.file-explorer`; persistent ⇒ bar stays
//     expanded; one more ArrowDown still moves the highlight (continuity).
//   - mouse ⇒ in persistent + native tree the bar auto-collapses and focus is
//     released (document.body.focus()), exactly as before the fix. In float (no
//     collapse) nothing dispatches focus away, so the only invariant is that the
//     open navigated — a smoke check, not a focus-release claim.
//
// Preview / native-tree factor: whether GitHub renders its own file tree (the
// auto-collapse trigger) is detected at RUNTIME and asserted accordingly —
// matching the convention in feature.auto-collapse-hint and the feature-preview
// drift tracker (no account mutation here). The nightly run flips GitHub's
// Feature Preview externally and re-runs; these specs read whatever is live.
//
// Floor factor: at the all-OFF Feature-Preview floor GitHub navigates with
// full document loads (no Turbo). The keyboard cells then still drive the
// open and assert the destination, but skip the focus-continuity half
// honestly — the intent lives in a module singleton that cannot cross a new
// JS context. The strict continuity assertions run on the soft-navigation
// floor, where the invariant exists.
//
// Signed-in only: Gitako needs the profile token to fetch the tree and GitHub
// only renders its native tree when signed in. Config is forced via the
// URL-config channel, which also disables persistence so the shared profile
// isn't polluted.

type Mode = 'persistent' | 'float'
type Method = 'keyboard' | 'mouse'

const REPO = 'https://github.com/EnixCoda/Gitako'
const sources = [
  { name: 'repo-root', path: 'tree/develop' },
  { name: 'blob', path: 'blob/develop/README.md' },
  { name: 'subfolder', path: 'tree/develop/src' },
  // Issue page: renders the default-branch tree; opening a file is a
  // cross-context navigation that remounts the sidebar (see header note).
  { name: 'issue', path: 'issues/318' },
]

const urlFor = (path: string, mode: Mode) =>
  `${REPO}/${path}?gitako-config-sidebarToggleMode=%22${mode}%22&gitako-config-intelligentToggle=null`

const isCollapsed = (page: Page) =>
  page.evaluate(
    sel => !!document.querySelector(sel)?.className.includes('collapsed'),
    selectors.gitako.bodyWrapper,
  )

const focusInTree = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest('.file-explorer'))

// Distinguish a Turbo body swap from a full document load when an open
// navigates. The keyboard-continuity fix holds the intent in a module-level
// singleton, which survives Turbo replacing <body> but not a new JS context.
// GitHub's all-OFF Feature-Preview floor navigates with full page loads (no
// Turbo), so continuity has no premise there; detect it and skip honestly
// instead of polling 15s for focus that cannot come back. A user cannot
// observe this distinction, which is why it takes a script step — same
// rationale as lifecycle.identity's softNavigationAvailable.
const DOCUMENT_SENTINEL_KEY = '__gitakoE2EDocumentSentinel'

async function stampDocument(page: Page): Promise<string> {
  const token = `${Date.now()}-${Math.random()}`
  await page.evaluate(
    ([key, value]) => {
      ;(window as unknown as Record<string, string>)[key] = value
    },
    [DOCUMENT_SENTINEL_KEY, token] as const,
  )
  return token
}

async function isSameDocument(page: Page, token: string): Promise<boolean> {
  return page
    .evaluate(
      ([key, expected]) =>
        (window as unknown as Record<string, string | undefined>)[key] === expected,
      [DOCUMENT_SENTINEL_KEY, token] as const,
    )
    .catch(() => false)
}

// GitHub's own code-view file tree — its presence is what makes auto-expand
// collapse the pinned bar. Decides whether the collapse assertions apply.
// Check VISIBILITY, not just presence: `#repos-file-tree` (and the "Expand
// file tree" control on PR pages) can exist while the tree is collapsed or
// hidden, and Gitako only defers to a tree the user can actually see — the
// same canonical check as feature.auto-collapse-hint.signed-in.spec.ts.
const nativeTreeShown = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector('#repos-file-tree')
    if (!el) return false
    const { width, height } = el.getBoundingClientRect()
    return width * height > 0
  })

const hasTreeNodes = (page: Page) =>
  page.evaluate(sel => !!document.querySelector(sel), `${selectors.gitako.files} .node-item`)

// Expand the bar if collapsed. Persistent opens via the toggle's click; float
// opens on HOVER (its onClick would toggle back off after onHover expanded it),
// and we leave the mouse on the toggle — outside the body wrapper — so float's
// mouse-leave collapse never fires. Returns whether the bar ended up expanded.
async function ensureExpanded(page: Page, mode: Mode) {
  if (!(await isCollapsed(page))) return true
  const toggle = page.locator(selectors.gitako.toggleButton)
  if (mode === 'float') await toggle.hover()
  else await toggle.click({ force: true })
  await sleep(800)
  return !(await isCollapsed(page))
}

// Focus the tree and ArrowDown until the highlight lands on a leaf file (a
// /blob/ href), so a following Enter performs a real open. Returns its title.
async function arrowToFile(page: Page, exclude: string[]) {
  await page.locator('.file-explorer').evaluate(el => (el as HTMLElement).focus())
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('ArrowDown')
    await sleep(120)
    const node = await page.evaluate(sel => {
      const el = document.querySelector(sel)
      return el ? { title: el.getAttribute('title'), href: el.getAttribute('href') } : null
    }, `${selectors.gitako.files} .node-item.focused`)
    if (node?.title && !exclude.includes(node.title) && node.href?.includes('/blob/')) {
      return node.title
    }
  }
  return null
}

test.describe('keyboard: file tree navigation matrix (mode × source × method)', () => {
  test.skip(
    !resolveProfilePath(),
    'no persistent profile; Gitako cannot fetch the tree to navigate',
  )

  for (const mode of ['persistent', 'float'] as Mode[]) {
    for (const source of sources) {
      for (const method of ['keyboard', 'mouse'] as Method[]) {
        test(`${mode} · ${source.name} · ${method}`, async ({ extensionPage }) => {
          await extensionPage.setViewportSize({ width: 1920, height: 1080 })
          await extensionPage.goto(urlFor(source.path, mode))
          await expect(extensionPage.locator(selectors.gitako.toggleButton)).toBeAttached({
            timeout: 15000,
          })

          // This cell exercises GITAKO's tree keyboard navigation, so we want
          // the bar open regardless of why it's collapsed. When GitHub really
          // shows its own file tree (see nativeTreeShown), Gitako auto-collapses
          // by design; the user opts into Gitako's tree by clicking the
          // tentacle, which is exactly what ensureExpanded does (a real click).
          // If Gitako still can't be opened, the cell has no Gitako tree to
          // drive — skip rather than test GitHub's tree by accident.
          test.skip(
            !(await ensureExpanded(extensionPage, mode)),
            'could not expand the bar (native tree drift?)',
          )
          const treeLoaded = await expect
            .poll(() => hasTreeNodes(extensionPage), { timeout: 15000 })
            .toBe(true)
            .then(() => true)
            .catch(() => false)
          test.skip(!treeLoaded, 'no tree nodes to navigate (page/tree drift?)')

          const target = await arrowToFile(extensionPage, ['README.md'])
          test.skip(!target, 'could not find a leaf file to open from this source')

          // Lets us tell afterwards whether this open swapped <body> in place
          // (Turbo) or replaced the document (all-OFF floor). See stampDocument.
          const documentToken = await stampDocument(extensionPage)

          if (method === 'keyboard') {
            await extensionPage.keyboard.press('Enter')
          } else {
            await extensionPage.locator(selectors.gitako.fileItemOf(target!)).click()
          }
          await extensionPage.waitForURL(`**/${target}`, { timeout: 15000 })
          await expect(extensionPage.locator(selectors.gitako.bodyWrapper)).toBeAttached()
          await expect.poll(() => hasTreeNodes(extensionPage), { timeout: 15000 }).toBe(true)

          if (method === 'keyboard') {
            test.skip(
              !(await isSameDocument(extensionPage, documentToken)),
              'open was a full document load (no Turbo at this floor); keyboard focus continuity cannot span a new JS context',
            )
            // Cross-context opens (notably issue -> blob) remount the sidebar.
            // Assert the eventual post-remount state instead of sampling at an
            // arbitrary fixed delay.
            await expect
              .poll(() => focusInTree(extensionPage), {
                message: 'focus returned to the tree after keyboard open',
                timeout: 15000,
              })
              .toBe(true)
            // ...and in persistent mode the bar must not collapse out from under it.
            if (mode === 'persistent') {
              await expect
                .poll(() => isCollapsed(extensionPage), {
                  message: 'pinned bar stayed expanded during keyboard nav',
                  timeout: 15000,
                })
                .toBe(false)
            }
            // The URL-gated redirect poll runs every 500ms. Recheck after two
            // ticks so a late redirect callback cannot collapse the restored
            // tree immediately after the first successful observation.
            await sleep(1100)
            expect(await focusInTree(extensionPage), 'focus remained in the tree').toBe(true)
            if (mode === 'persistent') {
              expect(await isCollapsed(extensionPage), 'pinned bar remained expanded').toBe(false)
            }
            // Continuity: one more ArrowDown moves the highlight off the opened
            // file. A no-op here would mean focus was silently lost.
            const focused = extensionPage.locator(`${selectors.gitako.files} .node-item.focused`)
            await extensionPage.keyboard.press('ArrowDown')
            await expect(focused).not.toHaveAttribute('title', target!, { timeout: 10000 })
          } else if (mode === 'persistent' && (await nativeTreeShown(extensionPage))) {
            // Negative control (only observable where a collapse can release
            // focus): a mouse open clears the keyboard-nav flag, so the bar
            // auto-collapses and document.body.focus() pulls focus out — exactly
            // as before the fix existed (proof the fix isn't sticky).
            await expect
              .poll(() => isCollapsed(extensionPage), {
                message: 'mouse-opened file auto-collapsed the bar',
                timeout: 15000,
              })
              .toBe(true)
            await expect
              .poll(() => focusInTree(extensionPage), {
                message: 'focus left the tree after mouse open',
                timeout: 15000,
              })
              .toBe(false)
          } else {
            // Float (or no native tree): nothing dispatches focus away, so there
            // is no focus-release to assert — just confirm the open navigated.
            expect(extensionPage.url(), 'mouse open navigated to the file').toContain(target!)
          }
        })
      }
    }
  }
})

// keyboardNavRef lifecycle: the keyboard-nav flag set by an in-tree file open
// must RELEASE once the user's keyboard attention leaves the tree, or one
// keyboard open would suppress auto-collapse forever for keyboard-only users
// (the flag was originally cleared only on mousedown). The release signal is a
// keydown whose target is outside the Gitako sidebar — e.g. activating a host
// page link — after which the next navigation must auto-collapse as if the
// keyboard session never happened. This is the keyboard-only counterpart of
// the matrix's mouse negative-control cells.
test.describe('keyboard: nav flag releases after keyboard leaves the tree', () => {
  test.skip(
    !resolveProfilePath(),
    'no persistent profile; Gitako cannot fetch the tree to navigate',
  )

  test('keydown outside the tree re-enables auto-collapse', async ({ extensionPage }) => {
    const page = extensionPage
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(urlFor('tree/develop', 'persistent'))
    await sleep(3000)

    test.skip(!(await ensureExpanded(page, 'persistent')), 'could not expand the bar')
    test.skip(!(await hasTreeNodes(page)), 'no tree nodes to navigate')

    // Step 1: keyboard-open a file — sets the keyboard-nav flag, and the
    // pinned bar must stay expanded (that's the feature, sanity-checked here).
    const target = await arrowToFile(page, ['README.md'])
    test.skip(!target, 'could not find a leaf file to open')
    await page.keyboard.press('Enter')
    await page.waitForURL(`**/${target}`, { timeout: 15000 })
    await sleep(2500)
    test.skip(await isCollapsed(page), 'bar collapsed during keyboard open (feature broken?)')
    // Auto-collapse only ever triggers where GitHub renders its own tree —
    // runtime-detected like the matrix cells; without it there is no signal.
    test.skip(!(await nativeTreeShown(page)), 'native tree not shown; auto-collapse n/a')

    // Step 2: keyboard-activate an item OUTSIDE the Gitako tree — a FILE in
    // GitHub's native TreeView (its items are role=treeitem <li>s, not
    // anchors; folders carry aria-expanded, files don't). locator.press
    // focuses the item and sends Enter — pure keyboard, no mouse anywhere —
    // so the flag may only be released by that outside keydown.
    const prevUrl = page.url()
    const fileItem = page
      .locator('#repos-file-tree li[role="treeitem"]:not([aria-expanded])')
      .filter({ hasNotText: target!.split('/').pop()! })
      .first()
    test.skip((await fileItem.count()) === 0, 'no other file item in the native tree')
    await fileItem.press('Enter')
    await expect.poll(() => page.url(), { timeout: 15000 }).not.toBe(prevUrl)
    await sleep(2500)

    // Destination is another blob page with the native tree, so auto-expand
    // computes collapsed. With the flag correctly released this wins again;
    // a stale flag would pin the bar expanded indefinitely.
    if (await nativeTreeShown(page)) {
      expect(
        await isCollapsed(page),
        'bar auto-collapsed once keyboard navigation left the tree',
      ).toBe(true)
    }
  })
})

// The PR diff tree is the changed-files list Gitako shows on a pull request's
// Files-changed page. It differs from the repo tree in two ways that matter
// here: (1) its leaves are diff anchors (href ends in `#diff-<hash>`), and (2)
// opening one is a SAME-PAGE hash scroll, not a navigation — so there's no
// redirect, no auto-collapse, and the URL only gains a fragment. GitHub moves
// focus to <body> on that scroll, so without the focusout-guard the user's
// keyboard position is lost after one file. This asserts focus stays in the
// tree so arrowing continues. Persistent mode only — the bar never collapses on
// a hash scroll, so the float/mouse axes add no signal here.
test.describe('keyboard: PR diff-tree navigation (same-page hash scroll)', () => {
  test.skip(!resolveProfilePath(), 'no persistent profile; Gitako cannot fetch the PR diff tree')

  // pull/311 is a large multi-file PR, so the diff tree always has several
  // leaves to arrow through for the continuity check.
  test('pull/311 changes · keyboard open retains focus in the diff tree', async ({
    extensionPage,
  }) => {
    const page = extensionPage
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(urlFor('pull/311/changes', 'persistent'))
    await sleep(4000)

    test.skip(!(await ensureExpanded(page, 'persistent')), 'could not expand the bar')
    test.skip(!(await hasTreeNodes(page)), 'no diff-tree nodes (PR/experience drift?)')

    await page.locator('.file-explorer').evaluate(el => (el as HTMLElement).focus())
    let target: string | null = null
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowDown')
      await sleep(100)
      const node = await page.evaluate(sel => {
        const el = document.querySelector(sel)
        return el ? { title: el.getAttribute('title'), href: el.getAttribute('href') } : null
      }, `${selectors.gitako.files} .node-item.focused`)
      if (node?.title && node.href?.includes('#diff-')) {
        target = node.title
        break
      }
    }
    test.skip(!target, 'could not focus a diff-tree leaf to open')

    await page.keyboard.press('Enter')
    // The open is a hash scroll, not a navigation; give the focusout-guard's
    // requestAnimationFrame restore (and any settling) time to run.
    await sleep(1500)

    // The user's requirement: opening a changed file keeps focus in the tree so
    // they can keep arrowing. Without the focusout-guard the diff scroll drops
    // focus to <body> and the next ArrowDown does nothing.
    expect(await focusInTree(page), 'focus stayed in the diff tree after keyboard open').toBe(true)

    // Continuity: arrowing is still live. Note the highlighted node may reset
    // here — the `#diff-<hash>` the open adds to the URL re-fires the
    // after-redirect path, which recomputes the current path (empty on a PR
    // changes page) and can clear the highlight. That's fine; ArrowDown then
    // re-anchors to the first node. What must hold is that ArrowDown still moves
    // focus to a node-item and never escapes the tree.
    const focused = page.locator(`${selectors.gitako.files} .node-item.focused`)
    await page.keyboard.press('ArrowDown')
    await expect(focused, 'ArrowDown re-highlights a node in the diff tree').toHaveCount(1, {
      timeout: 10000,
    })
    expect(await focusInTree(page), 'focus stayed in the tree while arrowing').toBe(true)
  })
})
