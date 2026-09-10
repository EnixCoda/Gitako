import { expect, test } from './fixtures'
import { selectors } from './selectors'
import { testURL } from './testURL'
import { sleep } from './utils'

/**
 * Selector drift tripwire.
 *
 * Every selector in `selectors.ts` is a coupling point to GitHub's DOM.
 * GitHub redesigns surfaces routinely, and a selector that silently
 * starts matching zero (or worse, the wrong number of) elements is the
 * #1 source of regressions in this codebase. This spec walks each
 * selector against a fixture URL where it should resolve, with a
 * known expected count. When GitHub drifts, this fails first — before
 * the functional tests downstream — giving a clear, focused signal.
 */

type Probe = {
  label: string
  url: string
  selector: string
  /** expected count exactly; for "must be at least N" set min instead */
  count?: number
  min?: number
}

const probes: Probe[] = [
  // repo overview surface
  {
    label: 'navBarItemIssues on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector: selectors.github.navBarItemIssues,
    count: 1,
  },
  {
    label: 'navBarItemPulls on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector: selectors.github.navBarItemPulls,
    count: 1,
  },
  {
    label: 'navBarItemIssues on blob page',
    url: 'https://github.com/EnixCoda/Gitako/blob/develop/src/analytics.ts',
    selector: selectors.github.navBarItemIssues,
    count: 1,
  },
  {
    label: 'navBarItemIssues on repo overview',
    url: 'https://github.com/EnixCoda/Gitako',
    selector: selectors.github.navBarItemIssues,
    count: 1,
  },

  // tree page file-list shape
  {
    label: 'fileListItemFileLinks on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector: selectors.github.fileListItemFileLinks,
    min: 1,
  },
  {
    label: 'fileListItemLinkOf(specific file) on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector: selectors.github.fileListItemLinkOf('analytics.ts'),
    count: 1,
  },

  // blob page breadcrumb
  {
    label: 'breadcrumbFileName on blob page',
    url: 'https://github.com/EnixCoda/Gitako/blob/develop/src/analytics.ts',
    selector: selectors.github.breadcrumbFileName,
    min: 1,
  },

  // Readme article — internal to attachCopySnippet in
  // src/platforms/GitHub/DOMHelper.ts. The selector lived in product code
  // and silently no-op'd when GitHub stopped wrapping the readme in
  // `main div#readme` — the only thing the user saw was that the copy
  // button stopped appearing on hover. This tripwire surfaces the drift
  // before users notice, at the DOM layer.
  {
    label: 'readme article exists on repo overview',
    url: 'https://github.com/EnixCoda/Gitako',
    selector: 'article.markdown-body, main div#readme article',
    count: 1,
  },

  // Embedded JSON on commit pages — getCommitTitle in
  // src/platforms/GitHub/DOMHelper.ts depends on this to show the commit
  // subject in Gitako's sidebar. If GitHub renames the app-name or
  // moves the embeddedData target, the title silently falls back to a
  // sha fragment.
  //
  // The current signed-in repo shell ships `app-name="repo"`, while
  // anonymous / legacy commit pages still ship `app-name="commits"`.
  // Only one is present at a time, so the combined selector still
  // resolves to exactly one on either page.
  {
    label: 'commits embedded JSON exists on commit page',
    url: 'https://github.com/EnixCoda/Gitako/commit/8adccd9',
    selector:
      'react-app[app-name="repo"] script[type="application/json"][data-target="react-app.embeddedData"], ' +
      'react-app[app-name="commits"] script[type="application/json"][data-target="react-app.embeddedData"]',
    count: 1,
  },

  // Embedded JSON on tree pages — resolveEmbeddedCodeViewData reads this
  // for branch name resolution. Locks in the `app-name="code-view"`
  // selector that the recent branch-resolution fix landed on.
  {
    label: 'code-view embedded JSON exists on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector:
      'react-app[app-name="code-view"] script[type="application/json"][data-target="react-app.embeddedData"]',
    count: 1,
  },

  // Octolytics meta tag — `isInRepoPage` falls back to this when
  // `.repohead` / `.author[itemprop="author"]` are absent (which they
  // are on the current GitHub DOM, so this fallback is the only path
  // actually doing work today). If GitHub drops octolytics, repo
  // detection fails and Gitako silently shows nothing.
  {
    label: 'octolytics repo meta tag on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector:
      'meta[name="octolytics-dimension-repository_nwo"], meta[name="octolytics-dimension-repository_id"]',
    min: 1,
  },

  // Ref picker button on signed-in tree pages — `getCurrentBranch`'s
  // DOM fallback path (used when embedded JSON parse fails) goes
  // through this element's textContent.
  {
    label: 'ref picker button on tree page',
    url: 'https://github.com/EnixCoda/Gitako/tree/develop/src',
    selector: '#ref-picker-repos-header-ref-selector',
    count: 1,
  },
]

test.describe('drift: selectors', () => {
  for (const p of probes) {
    test(p.label, async ({ extensionPage }) => {
      await extensionPage.goto(testURL([p.url] as unknown as TemplateStringsArray), {
        timeout: 20000,
      })
      await sleep(2500)
      const actual = await extensionPage.evaluate(
        sel => document.querySelectorAll(sel).length,
        p.selector,
      )
      if (p.count !== undefined) {
        expect(actual, `${p.label} — selector "${p.selector}"`).toBe(p.count)
      } else if (p.min !== undefined) {
        expect(actual, `${p.label} — selector "${p.selector}"`).toBeGreaterThanOrEqual(p.min)
      }
    })
  }
})
