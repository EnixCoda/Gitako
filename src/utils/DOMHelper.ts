/**
 * this helper helps manipulating DOM
 */
import { raiseError } from 'analytics'
import { Clippy } from 'components/Clippy'
import { CopyFileButton } from 'components/CopyFileButton'
import * as NProgress from 'nprogress'
import * as PJAX from 'pjax'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { renderReact } from './general'

NProgress.configure({ showSpinner: false })

/**
 * when gitako is ready, make page's header narrower
 */
export function markGitakoReadyState() {
  const readyClassName = 'gitako-ready'
  document.body.classList.add(readyClassName)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
export const bodySpacingClassName = 'with-gitako-spacing'
export function setBodyIndent(shouldShowGitako: boolean) {
  if (shouldShowGitako) {
    document.body.classList.add(bodySpacingClassName)
  } else {
    document.body.classList.remove(bodySpacingClassName)
  }
}

function $<EE extends Element, E extends (element: EE) => any, O extends () => any>(
  selector: string,
  existCallback?: E,
  otherwise?: O,
): E extends never
  ? O extends never
    ? Element | null
    : ReturnType<O> | null
  : O extends never
  ? ReturnType<E> | null
  : ReturnType<O> | ReturnType<E> {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element as EE) : element
  }
  return otherwise ? otherwise() : null
}

export function isInCodePage() {
  const branchListSelector = '#branch-select-menu.branch-select-menu'
  return Boolean($(branchListSelector))
}

export function getBranches() {
  const branchSelector = '.branch-select-menu .select-menu-list > div .select-menu-item-text'
  const branchElements = Array.from(document.querySelectorAll(branchSelector))
  return branchElements.map(element => element.innerHTML.trim())
}

export function getCurrentBranch() {
  const selectedBranchButtonSelector = '.repository-content .branch-select-menu summary'
  const branchButtonElement: HTMLElement = $(selectedBranchButtonSelector)
  if (branchButtonElement) {
    const branchNameSpanElement = branchButtonElement.querySelector('span')
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.innerText
      if (!partialBranchNameFromInnerText.includes('…')) return partialBranchNameFromInnerText
    }
    const defaultTitle = 'Switch branches or tags'
    const title = branchButtonElement.title.trim()
    if (title !== defaultTitle && !title.includes(' ')) return title
  }

  const findFileButtonSelector =
    '#js-repo-pjax-container .repository-content .file-navigation a[data-hotkey="t"]'
  const urlFromFindFileButton: string | undefined = $(
    findFileButtonSelector,
    element => (element as HTMLAnchorElement).href,
  )
  if (urlFromFindFileButton) {
    const commitPathRegex = /^(.*?)\/(.*?)\/find\/(.*?)$/
    const result = urlFromFindFileButton.match(commitPathRegex)
    if (result) {
      const [_, userName, repoName, branchName] = result
      if (!branchName.includes(' ')) return branchName
    }
  }

  raiseError(new Error('cannot get current branch'))
}

/**
 * add the logo element into DOM
 */
export function insertLogoMountPoint() {
  const logoSelector = '.gitako .gitako-logo'
  return $(logoSelector) || createLogoMountPoint()
}

function createLogoMountPoint() {
  const logoMountElement = document.createElement('div')
  logoMountElement.classList.add('gitako-logo-mount-point')
  document.body.appendChild(logoMountElement)
  return logoMountElement
}

/**
 * content above the file navigation bar is same for all pages of the repo
 * use this function to scroll down a bit to hide them
 */
export function scrollToRepoContent() {
  const repositoryContentSelector = '.repository-content'
  // do NOT use behavior: smooth here as it will scroll horizontally
  $(repositoryContentSelector, repositoryContentElement =>
    repositoryContentElement.scrollIntoView(),
  )
}

const pjax = new PJAX({
  elements: '.pjax-link',
  selectors: ['.repository-content', 'title'],
  scrollTo: false,
  analytics: false,
  cacheBust: false,
  forceCache: true, // TODO: merge namespace, add forceCache
})

export function loadWithPJAX(URL: string) {
  NProgress.start()
  pjax.loadUrl(URL, { scrollTo: 0 })
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
export function getCurrentPageType() {
  const blobWrapperSelector = '.repository-content .blob-wrapper table'
  const readmeSelector = '.repository-content .readme'
  return (
    $(blobWrapperSelector, () => PAGE_TYPES.RAW_TEXT) ||
    $(readmeSelector, () => PAGE_TYPES.RENDERED) ||
    PAGE_TYPES.OTHERS
  )
}

export const REPO_TYPE_PRIVATE = 'private'
export const REPO_TYPE_PUBLIC = 'public'
export function getRepoPageType() {
  const headerSelector = `#js-repo-pjax-container .pagehead.repohead h1`
  return $(headerSelector, header => {
    const repoPageTypes = [REPO_TYPE_PRIVATE, REPO_TYPE_PUBLIC]
    for (const repoPageType of repoPageTypes) {
      if (header.classList.contains(repoPageType)) {
        return repoPageType
      }
    }
    raiseError(new Error('cannot get repo page type'))
  })
}

/**
 * get text content of raw text content
 */
export function getCodeElement() {
  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    const codeContentSelector = '.repository-content .data table'
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
  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    // the button group in file content header
    const buttonGroupSelector = '.repository-content > .Box > .Box-header .BtnGroup'
    const buttonGroups = document.querySelectorAll(buttonGroupSelector)

    if (buttonGroups.length === 0) {
      raiseError(new Error(`No button groups found`))
    }

    const buttons: HTMLElement[] = []
    buttonGroups.forEach(buttonGroup => {
      if (!buttonGroup.lastElementChild) return
      const portal = ReactDOM.createPortal(React.createElement(CopyFileButton), buttonGroup)
      // creating a element for mounting button into button group, somehow hack
      const seedElementForButton = document.createElement('a')
      buttonGroup.appendChild(seedElementForButton)
      ReactDOM.render(portal, seedElementForButton)
      buttonGroup.removeChild(seedElementForButton)
      buttons.push(seedElementForButton)
    })
    return () =>
      buttons.forEach(button => {
        button.parentElement?.removeChild(button)
      })
  }
}

/**
 * copy content of a DOM element to clipboard
 */
export function copyElementContent(element: Element): boolean {
  let selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  const range = document.createRange()
  range.selectNode(element)
  selection = window.getSelection()
  if (selection) selection.addRange(range)
  const isCopySuccessful = document.execCommand('copy')
  selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  return isCopySuccessful
}

export function attachCopySnippet() {
  const readmeSelector = '.repository-content div#readme'
  return $(readmeSelector, () => {
    const readmeArticleSelector = '.repository-content div#readme article'
    return $(
      readmeArticleSelector,
      readmeElement =>
        readmeElement.addEventListener('mouseover', async ({ target }) => {
          if (target instanceof Element && target.nodeName === 'PRE') {
            if (
              target.previousSibling === null ||
              !(target.previousSibling instanceof Element) ||
              !target.previousSibling.classList.contains('clippy-wrapper')
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
                const clippyElement = await renderReact(
                  React.createElement(Clippy, { codeSnippetElement: target }),
                )
                target.parentNode.insertBefore(clippyElement, target)
              }
            }
          }
        }),
      () => {
        const plainReadmeSelector = '.repository-content div#readme .plain'
        $(plainReadmeSelector, undefined, () =>
          raiseError(
            new Error('cannot find mount point for copy snippet button while readme exists'),
          ),
        )
      },
    )
  })
}

/**
 * focus to side bar, user will be able to manipulate it with keyboard
 */
export function focusFileExplorer() {
  const sideBarContentSelector = '.gitako-side-bar .file-explorer'
  $(sideBarContentSelector, sideBarElement => {
    if (sideBarElement instanceof HTMLElement) sideBarElement.focus()
  })
}

export function focusSearchInput() {
  const searchInputSelector = '.search-input'
  $(searchInputSelector, searchInputElement => {
    if (
      document.activeElement !== searchInputElement &&
      searchInputElement instanceof HTMLElement
    ) {
      searchInputElement.focus()
    }
  })
}

export function mountTopProgressBar() {
  NProgress.start()
}

export function unmountTopProgressBar() {
  NProgress.done()
}
