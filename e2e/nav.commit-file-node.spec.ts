import { expect, test } from './fixtures'
import { ensureSidebarExpanded } from './sidebar'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { sleep } from './utils'

// A click on a file node of a commit page's tree must scroll the reader to that
// file's diff block ON the commit page — not navigate away to the file's own
// `/blob/` page.
//
// The tree's nodes are built by getCommitTreeData, which used to resolve each
// file's in-page anchor by looking up `[data-path="<path>"]` in the rendered
// diff. GitHub removed that attribute from commit-page diff blocks, so the
// lookup silently returned nothing, every node fell back to its `blob_url`, and
// a click performed a navigation — which is exactly the reported bug. The URL
// itself proves the outcome: a scroll keeps `<owner>/<repo>/commit/<sha>` (only
// the `#diff-…` fragment changes), a regression lands on
// `<owner>/<repo>/blob/<sha>/<path>`.
//
// Fixture commit (the bump of brace-expansion in this repo): a single-file
// commit, so the tree has one leaf and its diff block is always rendered. The
// spec deliberately does not assert that GitHub assigned the block an `id`:
// whether the browser has something to scroll to is GitHub's render decision,
// and it varies by commit — what Gitako must guarantee is the same-page jump
// (GitHub's own file tree links to the identical `#diff-<digest>` hash).
//
// Signed-in only: Gitako needs the profile token to list a commit's files.
test.describe('in Gitako commit page', () => {
  const commitSHA = 'd62b202e956a50d66f65339b6f9a28cf0fe45cfd'
  const commitURL = testURL`https://github.com/EnixCoda/Gitako/commit/${commitSHA}`

  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto(commitURL)
    await sleep(3000)
    await ensureSidebarExpanded(extensionPage)
  })

  test('clicking a file node jumps to its diff instead of opening the file', async ({
    extensionPage,
  }) => {
    // The commit page auto-expands the tree (shouldExpandAll), so the file
    // node is there once the signed-in tree fetch resolves.
    const fileNode = extensionPage.locator(selectors.gitako.fileItemOf('yarn.lock'))
    await expect(fileNode).toBeVisible({ timeout: 15000 })

    // The node already points at the in-page diff anchor. Assert the shape
    // rather than a digest value: the digest is GitHub's per-page hash.
    expect(await fileNode.getAttribute('href')).toMatch(/^#diff-[0-9a-f]{16,}$/)

    await fileNode.click()
    await sleep(1500)

    // Same page, scrolled to the diff — NOT the file's blob page.
    expect(extensionPage.url()).toMatch(/\/commit\/[0-9a-f]{7,}#diff-[0-9a-f]{16,}$/)
    expect(extensionPage.url()).not.toContain('/blob/')
    await expect(extensionPage.locator(selectors.github.commitPage).first()).toBeVisible()
  })
})
