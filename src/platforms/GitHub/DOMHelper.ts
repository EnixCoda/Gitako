import { raiseError } from 'analytics'
import { Clippy, ClippyClassName } from 'components/Clippy'
import * as React from 'react'
import { $ } from 'utils/$'
import { formatClass, parseIntFromElement } from 'utils/DOMHelper'
import { renderReact, run } from 'utils/general'
import { CopyFileButton, copyFileButtonClassName } from './CopyFileButton'

const selectors = {
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
  },
}

export function resolveMetaFromDOMJSON(): { defaultBranch: string; metaData: MetaData } | void {
  // in code page, there is a JSON script tag in DOM with meta data
  const json = $('script[type="application/json"][data-target="react-app.embeddedData"]', e => {
    try {
      return JSON.parse(e.textContent || '')
    } catch (error) {
      return null
    }
  })
  if (!json) return

  const { payload } = json
  if (!payload) return

  const { repo, refInfo } = payload
  if (!repo || !refInfo) return

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

export function resolveMeta(): Partial<MetaData> {
  const dataFromJSON = resolveMetaFromDOMJSON()
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
    '#branch-select-menu',
    '.branch-select-menu',
    selectors.globalNavigation.branchSelector,
  ].join()
  // The element may still exist in DOM for PR pages, but not visible
  return Boolean($(branchListSelector, e => e.offsetWidth > 0 && e.offsetHeight > 0))
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
    const branchNameSpanElement = branchButtonElement.querySelector('span')
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.textContent?.trim() || ''
      if (partialBranchNameFromInnerText && !partialBranchNameFromInnerText.includes('…'))
        return partialBranchNameFromInnerText
    }
    const defaultTitle = 'Switch branches or tags'
    const title = branchButtonElement.title.trim()
    if (title !== defaultTitle && !title.includes(' ')) return title
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

/**
 * add copy file content buttons to button groups
 * click these buttons will copy file content to clipboard
 */
export function attachCopyFileBtn() {
  const removeButtons = () => {
    const buttons = document.querySelectorAll(formatClass(copyFileButtonClassName))
    buttons.forEach(button => {
      button.parentElement?.removeChild(button)
    })
  }

  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    let buttonGroup: HTMLElement | null = null

    if (!buttonGroup) {
      const rawUrlButtonSelector = '#raw-url'
      const $buttonGroup = document.querySelector(rawUrlButtonSelector)?.parentElement
      if ($buttonGroup) buttonGroup = $buttonGroup
    }

    if (!buttonGroup) {
      const buttonGroupSelector = 'main .Box-header .BtnGroup'
      const buttonGroups = document.querySelectorAll(buttonGroupSelector)
      const $buttonGroup = buttonGroups[buttonGroups.length - 1]
      if ($buttonGroup) buttonGroup = $buttonGroup as HTMLElement
    }

    run(async () => {
      if (!buttonGroup) raiseError(new Error(`No button groups found`))
      else if (!buttonGroup.lastElementChild) return
      else {
        removeButtons() // prevent duplicated buttons
        const button = await renderReact(React.createElement(CopyFileButton))
        if (button instanceof HTMLElement) buttonGroup.appendChild(button)
      }
    })
  }

  // return callback so that disabling after redirecting from file page to non-page works properly
  return removeButtons
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
  if (!pathElement?.querySelector('.js-repo-root')) {
    return []
  }
  const path = ((pathElement as HTMLDivElement).textContent || '')
    .replace(/\n/g, '')
    .replace(/\/\s+Jump to.*/m, '')
    .trim()
    .split('/')
    .filter(Boolean)
    .slice(1) // the first is the repo's name
  return path
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
