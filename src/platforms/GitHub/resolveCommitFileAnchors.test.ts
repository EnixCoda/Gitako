import { resolveCommitDiffEntriesFromEmbeddedText } from './embeddedDataStructures'
import { resolveFileAnchors } from './resolveCommitFileAnchors'

// Selector used by DOMHelper.resolveEmbeddedCommitDiffData to find a commit
// page's embedded payload. Kept in sync here so the test exercises the real
// text→entries path instead of a hand-rolled stub.
const EMBEDDED_DATA_SELECTOR =
  'react-app[app-name="repo"] script[type="application/json"][data-target="react-app.embeddedData"]'

function docFrom(html: string) {
  return new DOMParser().parseFromString(html, 'text/html')
}

function getDiffEntries(doc: Document) {
  return resolveCommitDiffEntriesFromEmbeddedText(
    doc.querySelector(EMBEDDED_DATA_SELECTOR)?.textContent,
  )
}

function embeddedDataScript(payload: unknown) {
  return `<react-app app-name="repo"><script type="application/json" data-target="react-app.embeddedData">${JSON.stringify(
    payload,
  )}</script></react-app>`
}

const digest = '51e4f558fae534656963876761c95b83b6ef5da5103c4adef6768219ed76c2de'

describe('resolveCommitDiffEntriesFromEmbeddedText', () => {
  const entries = [
    { path: 'yarn.lock', pathDigest: 'a'.repeat(64) },
    { path: 'src/index.ts', pathDigest: 'b'.repeat(64) },
  ]

  test('reads current GitHub.com commitRoute.diffEntryData', () => {
    const doc = docFrom(
      embeddedDataScript({ payload: { commitRoute: { diffEntryData: entries } } }),
    )
    expect(getDiffEntries(doc)).toEqual(entries)
  })

  test('reads legacy payload.commit.files', () => {
    const doc = docFrom(embeddedDataScript({ payload: { commit: { files: entries } } }))
    expect(getDiffEntries(doc)).toEqual(entries)
  })

  test.each([
    'not json',
    JSON.stringify({ payload: {} }),
    JSON.stringify({ payload: { commit: {} } }),
    JSON.stringify({ payload: { commitRoute: {} } }),
  ])('returns no entries for unsupported payload %#', text => {
    expect(resolveCommitDiffEntriesFromEmbeddedText(text)).toEqual([])
  })

  test('returns no entries for a missing payload', () => {
    expect(resolveCommitDiffEntriesFromEmbeddedText(undefined)).toEqual([])
  })
})

describe('resolveFileAnchors', () => {
  test('maps paths to diff block ids from the embedded diff entry data', () => {
    // Shape observed on the current commit page: the rendered block has an
    // `id="diff-<digest>"` and its header links to that hash, but no
    // `data-path` attribute anywhere — so the id has to come from the JSON.
    const doc = docFrom(
      `<div role="region" id="diff-${digest}">` +
        `<div class="diff-file-header"><h3><a href="#diff-${digest}">yarn.lock</a></h3></div>` +
        `</div>` +
        embeddedDataScript({
          payload: {
            commitRoute: {
              diffEntryData: [
                { path: 'yarn.lock', pathDigest: digest },
                // Not rendered yet — GitHub loads later blocks lazily.
                { path: 'src/index.ts', pathDigest: 'other-digest' },
              ],
            },
          },
        }),
    )

    const anchors = resolveFileAnchors([doc], getDiffEntries)
    expect(anchors.get('yarn.lock')).toBe(`diff-${digest}`)
    expect(anchors.get('src/index.ts')).toBe('diff-other-digest')
  })

  test('falls back to header links grouped under data-path when the JSON is missing', () => {
    const doc = docFrom(
      `<div id="diff-legacy"><div data-path="yarn.lock"><a href="#diff-legacy">yarn.lock</a></div></div>`,
    )

    expect(resolveFileAnchors([doc], getDiffEntries).get('yarn.lock')).toBe('diff-legacy')
  })

  test('normalizes direction-control characters GitHub wraps file names in', () => {
    const doc = docFrom(
      embeddedDataScript({
        payload: {
          commitRoute: { diffEntryData: [{ path: '\u2066yarn.lock\u2069', pathDigest: digest }] },
        },
      }),
    )

    expect(resolveFileAnchors([doc], getDiffEntries).get('yarn.lock')).toBe(`diff-${digest}`)
  })

  test('returns no anchors when nothing maps paths to diff blocks', () => {
    // The regression shape: blocks have ids but no per-file path information,
    // so a click must not invent an anchor.
    expect(
      resolveFileAnchors([docFrom(`<div role="region" id="diff-${digest}"></div>`)], getDiffEntries)
        .size,
    ).toBe(0)
  })
})
