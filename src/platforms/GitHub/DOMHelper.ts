import { raiseError } from 'analytics'
import { Clippy, ClippyClassName } from 'components/Clippy'
import * as React from 'react'
import * as s from 'superstruct'
import { $ } from 'utils/$'
import { formatClass, parseIntFromElement } from 'utils/DOMHelper'
import { renderReact } from 'utils/general'
import { embeddedDataStruct } from './embeddedDataStructures'

const selectors = {
  normal: {
    reactApp: `react-app[app-name="react-code-view"] [data-target="react-app.reactRoot"]`,
    codeTab: '#code-tab',
    branchSwitcher: [`summary[title="Switch branches or tags"]`, `#branch-select-menu`].join(),
    fileNavigation: `.file-navigation`,
    breadcrumbs: `[data-testid="breadcrumbs"]`,
    breadcrumbsFilename: `[data-testid="breadcrumbs-filename"]`,
  },
  globalNavigation: {
    navbar: {
      repositoryOwner: [
        '.AppHeader-context-item[data-hovercard-type="user"]',
        '.AppHeader-context-item[data-hovercard-type="organization"]',
      ].join(),
      // its meant to be the element visually next to the `repositoryOwner` element
      repositoryName:
        'nav[role="navigation"] ul[role="list"] li:nth-child(2) .AppHeader-context-item',
    },
    branchSelector: 'button[id^="branch-picker-"]',
    pathContext: '[data-testid="breadcrumbs"]',
    pathContextFileName: '[data-testid="breadcrumbs-filename"]',
    pathContextScreenReaderHeading: '[data-testid="screen-reader-heading"]',
    embeddedData: {
      app: 'script[type="application/json"][data-target="react-app.embeddedData"]',
      reposOverview:
        '[partial-name="repos-overview"] script[type="application/json"][data-target="react-partial.embeddedData"]',
    },
  },
}

const getDOMJSON = (selector: string) =>
  $(selector, e => {
    try {
      return JSON.parse(e.textContent || '')
    } catch (error) {
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

function resolveEmbeddedReposOverviewData() {
  const data = getDOMJSON(selectors.globalNavigation.embeddedData.reposOverview)
  if (s.is(data, embeddedDataStruct.reposOverview))
    return getMetaFromPayload(data.props.initialPayload)
}

export function resolveEmbeddedData(): {
  defaultBranch: string
  metaData: MetaData
} | void {
  return resolveEmbeddedAppData() || resolveEmbeddedReposOverviewData()
}

export function resolveMeta(): Partial<MetaData> {
  const dataFromJSON = resolveEmbeddedData()
  if (dataFromJSON) return dataFromJSON.metaData

  const metaData = {
    userName:
      $(
        '[itemprop="author"] > a[rel="author"]',
        e => e.textContent?.trim(),
        () => $(selectors.globalNavigation.navbar.repositoryOwner, e => e.textContent?.trim()),
      ) || undefined,
    repoName:
      $(
        '[itemprop="name"] > a[href]',
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

export function isInPullFilesPage() {
  return $('.tabnav-tab.selected #files_tab_counter')
}

export function getIssueTitle() {
  const title = $('.gh-header-title')?.textContent
  return title?.trim().replace(/\n/g, '')
}

export function getCommitTitle() {
  const title = $('.commit-title')?.textContent
  return title?.trim().replace(/\n/g, '')
}

export function getCurrentBranch(passive = false) {
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

  if (!passive) raiseError(new Error('cannot get current branch'))
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
  const readmeSelector = 'main div#readme'
  return $(readmeSelector, () => {
    const readmeArticleSelector = 'main div#readme article'
    return $(
      readmeArticleSelector,
      readmeElement => {
        const mouseOverCallback = async ({ target }: Event): Promise<void> => {
          if (target instanceof Element && target.nodeName === 'PRE') {
            if (
              target.previousSibling === null ||
              !(target.previousSibling instanceof Element) ||
              !target.previousSibling.classList.contains(ClippyClassName)
            ) {
              /**
               *  <article>
               *    <pre></pre>     <!-- case A -->
               *    <div class="highlight">
               *      <pre></pre>   <!-- case B -->
               *    </div>
               *  </article>
               */
              if (target.parentNode) {
                removeAttachedOnes() // show no more than one button
                const clippyElement = await renderReact(
                  React.createElement(Clippy, { codeSnippetElement: target }),
                )
                if (clippyElement instanceof HTMLElement) {
                  target.parentNode.insertBefore(clippyElement, target)
                }
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
      },
      () => {
        // in URL like `/{user}/{repo}/delete/{branch}/path/to/file
        const deleteReadmeSelector = 'main div#readme del'
        if (!$(deleteReadmeSelector)) {
          // in pages where readme is not markdown, e.g. txt
          const plainReadmeSelector = 'main div#readme .plain'
          if (!$(plainReadmeSelector)) {
            raiseError(
              new Error('cannot find mount point for copy snippet button while readme exists'),
            )
          }
        }
      },
    )
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
