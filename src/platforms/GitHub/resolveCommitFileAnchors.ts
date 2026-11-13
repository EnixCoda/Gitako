import { CommitDiffEntry } from './embeddedDataStructures'
import { normalizeGitHubPath } from './utils'

/**
 * Resolve, per changed file, the id of its diff block on a commit page so a
 * click on the file node scrolls to that block instead of leaving the page.
 *
 * Two sources, in order of preference:
 *
 * 1. Rendered block headers: an `<a href="#diff-…">` whose closest ancestor
 *    carries `data-path`. GitHub currently drops `data-path` from commit-page
 *    diff blocks, which made the path→block lookup fail silently: every node
 *    kept its blob URL and clicking it redirected to the file's own page
 *    instead of scrolling. Kept for layouts that still ship the attribute.
 * 2. The embedded `diffEntryData` JSON (path → pathDigest): the commit page
 *    renders only the first few diff blocks and loads the rest lazily, so the
 *    JSON is what covers files whose blocks have not arrived yet.
 */
export function resolveFileAnchors(
  documents: Document[],
  getDiffEntries: (doc: Document) => CommitDiffEntry[],
) {
  const anchors = new Map<string, string>()

  for (const doc of documents) {
    const links = doc.querySelectorAll('a[href^="#diff-"]')
    for (let i = 0; i < links.length; i++) {
      const hash = links[i].getAttribute('href')
      if (!hash) continue
      const path = links[i].closest('[data-path]')?.getAttribute('data-path')
      if (path) anchors.set(normalizeGitHubPath(path), hash.slice(1))
    }
  }

  for (const doc of documents) {
    for (const entry of getDiffEntries(doc)) {
      const path = normalizeGitHubPath(entry.path)
      if (!anchors.has(path) && entry.pathDigest) anchors.set(path, `diff-${entry.pathDigest}`)
    }
  }

  return anchors
}
