import { raiseError } from 'analytics'
import { Clippy, ClippyClassName } from 'components/Clippy'
import React from 'react'
import * as s from 'superstruct'
import { $, make$ } from 'utils/$'
import { formatClass, parseIntFromElement } from 'utils/DOMHelper'
import { renderReact } from 'utils/general'
import { embeddedDataStruct, resolveCommitShortMessageMarkdown } from './embeddedDataStructures'
import * as URLHelper from './URLHelper'

const selectors = {
  normal: {
    userName: '[itemprop="author"] > a[rel="author"]',
    repoName: '[itemprop="name"] > a[href]',
    reactApp: `react-app[app-name="react-code-view"] [data-target="react-app.reactRoot"]`,
    codeTab: '#code-tab',
    branchSwitcher: [
      `summary[title="Switch branches or tags"]`,
      `#branch-select-menu`,
      `#branch-picker-repos-header-ref-selector`,
      `#branch-picker-repos-header-ref-selector-wide`,
    ].join(),
    fileNavigation: `.file-navigation`,
    breadcrumbs: `[data-testid="breadcrumbs"]`,
    breadcrumbsFilename: `[data-testid="breadcrumbs-filename"]`,
  },
  globalNavigation: {
    navbar: {
      repositoryOwner: [
        'nav[role="navigation"][aria-label="GitHub Breadcrumb"] [id^="contextregion-usercrumb"][id$="-link"]',
        '.AppHeader-context-item[data-hovercard-type="user"]',
        '.AppHeader-context-item[data-hovercard-type="organization"]',
      ].join(),
      // its meant to be the element visually next to the `repositoryOwner` element
      repositoryName: [
        'nav[role="navigation"][aria-label="GitHub Breadcrumb"] [id^="contextregion-repositorycrumb"][id$="-link"]',
        'nav[role="navigation"] ul[role="list"] li:nth-child(2) .AppHeader-context-item',
      ].join(),
    },
    treeViewBranchSelector: ['#react-repos-tree-pane-ref-selector'].join(),
    branchSelector: [
      'button[id^="branch-picker-"]',
      // signed-in code-view picker (the `-wide` variant ships in some layouts,
      // the bare id ships in others; keep both)
      '#ref-picker-repos-header-ref-selector',
      '#ref-picker-repos-header-ref-selector-wide',
    ].join(),
    pathContext: '[data-testid="breadcrumbs"]',
    pathContextFileName: '[data-testid="breadcrumbs-filename"]',
    pathContextScreenReaderHeading: '[data-testid="screen-reader-heading"]',
    embeddedData: {
      app: 'script[type="application/json"][data-target="react-app.embeddedData"]',
      // Signed-in users get `app-name="code-view"`; anonymous users get the
      // legacy `react-code-view`. Match either.
      reactAppCodeView: [
        'react-app[app-name="code-view"] script[type="application/json"][data-target="react-app.embeddedData"]',
        'react-app[app-name="react-code-view"] script[type="application/json"][data-target="react-app.embeddedData"]',
      ].join(),
      reposOverview:
        '[partial-name="repos-overview"] script[type="application/json"][data-target="react-partial.embeddedData"]',
      pullRequest: 'script[type="application/json"][data-target="react-app.embeddedData"]',
    },
  },
}

const getDOMJSON = (selector: string, _$ = $) =>
  _$(selector, e => {
    try {
      return JSON.parse(e.textContent || '')
    } catch {
      return null
    }
  })

function getMetaFromPayload(payload: s.Infer<typeof embeddedDataStruct.repoPayload>) {
  const { repo, refInfo } = payload
  const { defaultBranch, name: repoName, ownerLogin: userName } = repo
  const { name: branchName } = refInfo

  return {
    defaultBranch,
    metaData: {
      userName,
      repoName,
      branchName,
    },
  }
}

// in code page, there is a JSON script tag in DOM with meta data
function resolveEmbeddedAppData() {
  const data = getDOMJSON(selectors.globalNavigation.embeddedData.app)
  if (s.is(data, embeddedDataStruct.app)) return getMetaFromPayload(data.payload)
}

function resolveEmbeddedCodeViewData() {
  const data = getDOMJSON(selectors.globalNavigation.embeddedData.reactAppCodeView)
  if (!s.is(data, embeddedDataStruct.codeViewApp)) return
  const p = data.payload
  // Check value-truthy, not just key presence: a payload like
  // `{ refInfo: null, codeViewLayoutRoute: { refInfo: { name: ... } } }`
  // would validate against the third union variant, but an `'in'` check on
  // the top-level key would return `null` and the caller would crash on
  // `.name`. Prefer the nested route fields — that's the authoritative
  // shape on signed-in pages; top-level refInfo is the legacy anonymous
  // form, kept as a last-resort fallback.
  const tree = ('codeViewTreeRoute' in p && p.codeViewTreeRoute?.refInfo) || null
  if (tree?.name) return { refInfo: tree }
  const layout = ('codeViewLayoutRoute' in p && p.codeViewLayoutRoute?.refInfo) || null
  if (layout?.name) return { refInfo: layout }
  const top = ('refInfo' in p && p.refInfo) || null
  if (top?.name) return { refInfo: top }
}

function resolveEmbeddedReposOverviewData() {
  const data = getDOMJSON(selectors.globalNavigation.embeddedData.reposOverview)
  if (s.is(data, embeddedDataStruct.reposOverview))
    return getMetaFromPayload(data.props.initialPayload)
}

export function resolveEmbeddedPullRequestData(doc: Document) {
  const data = getDOMJSON(selectors.globalNavigation.embeddedData.pullRequest, make$(doc))
  if (s.is(data, embeddedDataStruct.pullRequest)) return data
}

export function resolveMetaFromEmbeddedData(): {
  defaultBranch: string
  metaData: MetaData
} | void {
  return resolveEmbeddedAppData() || resolveEmbeddedReposOverviewData()
}

export function resolveMeta(): Partial<MetaData> {
  const dataFromJSON = resolveMetaFromEmbeddedData()
  if (dataFromJSON) return dataFromJSON.metaData

  const metaData = {
    userName:
      $(
        [selectors.normal.userName, selectors.globalNavigation.navbar.repositoryOwner].join(),
        e => e.textContent?.trim(),
        () => $(selectors.globalNavigation.navbar.repositoryOwner, e => e.textContent?.trim()),
      ) || undefined,
    repoName:
      $(
        [selectors.normal.repoName, selectors.globalNavigation.navbar.repositoryName].join(),
        e => e.textContent?.trim(),
        () => $(selectors.globalNavigation.navbar.repositoryName, e => e.textContent?.trim()),
      ) || undefined,
    branchName: getCurrentBranch(true),
  }
  if (!metaData.userName || !metaData.repoName) {
    raiseError(new Error(`Cannot resolve meta from DOM`))
  }
  return metaData
}

export function isInRepoPage() {
  const repoHeadSelector = '.repohead'
  const authorNameSelector = '.author[itemprop="author"]'
  const repoMetaSelector = [
    'meta[name="octolytics-dimension-repository_nwo"]',
    'meta[name="octolytics-dimension-repository_id"]',
  ].join()
  if (document.querySelector(repoMetaSelector)) return true

  return Boolean(
    document.querySelector(
      [
        repoHeadSelector,
        authorNameSelector,
        selectors.globalNavigation.navbar.repositoryOwner,
      ].join(),
    ),
  )
}

export function isInCodePage() {
  const branchListSelector = [
    selectors.normal.breadcrumbsFilename,
    selectors.normal.branchSwitcher,
  ].join()
  // The element may still exist in DOM for PR pages, but not visible
  return Boolean($(branchListSelector))
}

export function getIssueTitle() {
  const titleContainerSelectors = [
    '[data-component="TitleArea"] [data-component="PH_Title"]', // PR new experience title
    '.gh-header-title',
  ]
  const title = (
    $(
      // exclude issue ID from title
      titleContainerSelectors.map(selector => `${selector} .markdown-title`).join(),
    ) ?? $(titleContainerSelectors.join())
  )?.textContent
  return title?.trim().replace(/\n/g, '')
}

export function getCommitTitle() {
  // GitHub's current commit page ships the message in an embedded JSON
  // payload (under `payload.commitRoute.commit` on GitHub.com and
  // `payload.commit` on older/Enterprise layouts); the legacy `.commit-title`
  // element is gone in the new shell. Prefer the JSON (more stable than
  // React-generated class names); fall back to the legacy DOM selector for
  // any pages still serving the old layout.
  // Signed-in users on the unified repo shell get `app-name="repo"`;
  // anonymous / legacy layouts still ship `app-name="commits"`. Match
  // either so the commit subject keeps resolving on both. The payload
  // shape (`payload.commitRoute.commit.shortMessageMarkdown` on
  // GitHub.com, `payload.commit.shortMessageMarkdown` on legacy /
  // Enterprise pages) is unchanged between the two containers.
  const data = getDOMJSON(
    [
      'react-app[app-name="repo"] script[type="application/json"][data-target="react-app.embeddedData"]',
      'react-app[app-name="commits"] script[type="application/json"][data-target="react-app.embeddedData"]',
    ].join(),
  )
  const html = resolveCommitShortMessageMarkdown(data)
  if (html) {
    // Strip HTML tags from the markdown render (the subject is wrapped
    // in a single <div> per the current shape; this also handles inline
    // emphasis if GitHub ships any in the future). Use DOMParser rather
    // than `innerHTML =` so that any `<img>` in the message doesn't
    // start fetching its src from the extension's content-script context
    // — DOMParser builds an inert document.
    const text = new DOMParser()
      .parseFromString(html, 'text/html')
      .body.textContent?.trim()
      .replace(/\n/g, '')
    if (text) return text
  }
  const legacy = $('.commit-title')?.textContent
  return legacy?.trim().replace(/\n/g, '')
}

export function getCurrentBranch(passive = false) {
  const embeddedData = resolveEmbeddedCodeViewData()
  if (embeddedData) {
    return embeddedData.refInfo.name
  }

  {
    const treeViewSelectedBranchButtonSelector = [
      selectors.globalNavigation.treeViewBranchSelector,
    ].join()
    const treeViewSelectedBranchButtonElement = $(treeViewSelectedBranchButtonSelector)
    const branchName = treeViewSelectedBranchButtonElement?.textContent.trim()
    if (branchName) {
      return branchName
    }
  }

  const selectedBranchButtonSelector = [
    'main #branch-select-menu summary',
    'main .branch-select-menu summary',
    selectors.globalNavigation.branchSelector,
  ].join()
  const branchButtonElement = $(selectedBranchButtonSelector)
  if (branchButtonElement) {
    const branchNameSpanElement = branchButtonElement.querySelector(
      ['.ref-selector-button-text-container', 'span'].join(),
    )
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.textContent?.trim() || ''
      if (partialBranchNameFromInnerText && !partialBranchNameFromInnerText.includes('…'))
        return partialBranchNameFromInnerText
    }
    const defaultTitle = 'Switch branches or tags'
    const title = branchButtonElement.title.trim()
    if (title && title !== defaultTitle && !title.includes(' ')) return title
  }

  const findFileButtonSelector = 'main .file-navigation a[data-hotkey="t"]'
  const urlFromFindFileButton = $(
    findFileButtonSelector,
    element => (element as HTMLAnchorElement).href,
  )
  if (urlFromFindFileButton) {
    const commitPathRegex = /^(.*?)\/(.*?)\/find\/(.*?)$/
    const result = urlFromFindFileButton.match(commitPathRegex)
    if (result) {
      const [_, userName, repoName, branchName] = result // eslint-disable-line @typescript-eslint/no-unused-vars
      if (!branchName.includes(' ')) return branchName
    }
  }

  const branchNameFromCodeTab = $(selectors.normal.codeTab, e => {
    if (e instanceof HTMLAnchorElement) {
      const chunks = e.href.split('/')
      const indexOfTree = chunks.indexOf('tree')
      if (indexOfTree === -1) return
      const branchName = chunks.slice(indexOfTree + 1).join('/')
      return branchName
    }
  })
  if (branchNameFromCodeTab) return branchNameFromCodeTab

  if (!passive) {
    raiseError(new Error('cannot get current branch'))
  }
}

/**
 * there are few types of pages on GitHub, mainly
 * 1. raw text: code
 * 2. rendered content: like Markdown
 * 3. preview: like image
 */
const PAGE_TYPES = {
  RAW_TEXT: 'raw_text',
  RENDERED: 'rendered',
  SEARCH: 'search',
  // PREVIEW: 'preview',
  OTHERS: 'others',
}

/**
 * this function tries to tell which type current page is of
 *
 * note: not determining through file extension here
 * because there might be files using wrong extension name
 *
 * TODO: distinguish type 'preview'
 */
function getCurrentPageType() {
  const searchResultSelector = '.search-sub-header'
  const blobPathSelector = '[aria-label="file content"]'
  const readmeSelector = 'main #readme'
  return (
    $(searchResultSelector, () => PAGE_TYPES.SEARCH) ||
    $(blobPathSelector, () => PAGE_TYPES.RAW_TEXT) ||
    $(readmeSelector, () => PAGE_TYPES.RENDERED) ||
    PAGE_TYPES.OTHERS
  )
}

/**
 * get text content of raw text content
 */
export function getCodeElement() {
  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    const codeContentSelector = 'main .data table'
    const codeContentElement = $(codeContentSelector)
    if (!codeContentElement) {
      raiseError(new Error('cannot find code content element'))
    }
    return codeContentElement
  }
}

export function attachCopySnippet() {
  // The copy-snippet feature is for the readme on code-view repo pages.
  // The readme is `article.markdown-body` in the current React shell
  // and `main div#readme article` in the legacy shell — both selectors
  // are intentionally loose. The loose selectors ALSO match `<article
  // class="markdown-body">` on issue/PR/wiki/release pages, where we
  // must NOT attach the mouseover handler. Gate by URL: only the repo
  // root (`/owner/repo`) and tree views (`/owner/repo/tree/...`) have
  // a readme rendered into the main content area.
  const { type } = URLHelper.parse()
  if (type !== undefined && type !== 'tree') return
  const readmeArticleSelector = ['article.markdown-body', 'main div#readme article'].join()
  return $(readmeArticleSelector, readmeElement => {
    const mouseOverCallback = async ({ target }: Event): Promise<void> => {
      if (!(target instanceof Element)) return
      // `mouseover` fires on the innermost element under the cursor. Current
      // GitHub readmes nest the code in `<pre><code>…`, so the target is the
      // `<code>` (or a syntax span), never the `<pre>`. Resolve up to the
      // enclosing pre instead of requiring target to BE the pre — otherwise
      // the button silently never attaches.
      const pre = target.closest('pre')
      if (!pre) return
      if (
        pre.previousSibling === null ||
        !(pre.previousSibling instanceof Element) ||
        !pre.previousSibling.classList.contains(ClippyClassName)
      ) {
        /**
         *  <article>
         *    <pre></pre>     <!-- case A -->
         *    <div class="highlight">
         *      <pre></pre>   <!-- case B -->
         *    </div>
         *  </article>
         */
        if (pre.parentNode) {
          removeAttachedOnes() // show no more than one button
          const clippyElement = await renderReact(
            React.createElement(Clippy, { codeSnippetElement: pre }),
          )
          if (clippyElement instanceof HTMLElement) {
            pre.parentNode.insertBefore(clippyElement, pre)
          }
        }
      }
    }
    function removeAttachedOnes() {
      const buttons = document.querySelectorAll(formatClass(ClippyClassName))
      buttons.forEach(button => {
        button.parentElement?.removeChild(button)
      })
    }
    readmeElement.addEventListener('mouseover', mouseOverCallback)
    return () => {
      readmeElement.removeEventListener('mouseover', mouseOverCallback)
      removeAttachedOnes()
    }
  })
}

export function getPath() {
  const folderPathElementSelector = '.file-navigation .position-relative' // available when in path like '/tree/...'
  const blobPathElementSelector = '#blob-path' // available when in path like '/blob/...'
  const pathElement =
    document.querySelector(blobPathElementSelector) ||
    document.querySelector(folderPathElementSelector)?.nextElementSibling
  if (pathElement?.querySelector('.js-repo-root')) {
    const path = (pathElement.textContent || '')
      .replace(/\n/g, '')
      .replace(/\/\s+Jump to.*/m, '')
      .trim()
      .split('/')
      .filter(Boolean)
      .slice(1) // the first is the repo's name
    return path
  }

  const pathContextElement = document.querySelector(
    selectors.globalNavigation.pathContext,
  )?.parentElement
  let path = pathContextElement?.textContent?.trim()
  if (path) {
    // [Breadcrumbs]:repoName/:path
    const screenReader = pathContextElement?.querySelector(
      selectors.globalNavigation.pathContextScreenReaderHeading,
    )
    if (screenReader) path = path.replace(screenReader.textContent || '', '')
    return path.split('/').slice(1)
  }

  return []
}

export function isNativeFileTreeShown() {
  return Boolean($('#repos-file-tree'))
}

export function isNativePRFileTreeShown() {
  return $('file-tree[data-target="diff-layout.fileTree"]', ele => {
    // It would be set `display: hidden;` when collapsed
    const { width, height } = ele.getBoundingClientRect()
    return width * height > 0
  })
}

export function selectEnterpriseStatHeader() {
  return $('.stats-ui-enabled .server-stats')
}

export function getPullRequestFilesCount() {
  return $('#files_tab_counter', parseIntFromElement)
}

export function getPRDiffTotalStat() {
  const [added, removed] = [$('#diffstat .color-fg-success'), $('#diffstat .color-fg-danger')].map(
    e => (e ? parseIntFromElement(e) : null),
  )
  return {
    added,
    removed,
  }
}
