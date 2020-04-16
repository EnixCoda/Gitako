import { raiseError } from 'analytics'
import { Clippy, ClippyClassName } from 'components/Clippy'
import * as React from 'react'
import { $ } from 'utils/DOMHelper'
import { renderReact } from 'utils/general'
import { CopyFileButton, copyFileButtonClassName } from './CopyFileButton'

export function isInCodePage() {
  const branchListSelector = '#branch-select-menu.branch-select-menu'
  return Boolean($(branchListSelector))
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
  const blobPathSelector = '#blob-path' // path next to branch switcher
  const blobWrapperSelector = '.repository-content .blob-wrapper table'
  const readmeSelector = '.repository-content .readme'
  const searchResultSelector = '.codesearch-results'
  return (
    $(searchResultSelector, () => PAGE_TYPES.SEARCH) ||
    $(blobWrapperSelector, () => $(blobPathSelector, () => PAGE_TYPES.RAW_TEXT)) ||
    $(readmeSelector, () => PAGE_TYPES.RENDERED) ||
    PAGE_TYPES.OTHERS
  )
}

const REPO_TYPE_PRIVATE = 'private'
const REPO_TYPE_PUBLIC = 'public'
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

    buttonGroups.forEach(async buttonGroup => {
      if (!buttonGroup.lastElementChild) return
      const button = await renderReact(React.createElement(CopyFileButton))
      if (button instanceof HTMLElement) {
        buttonGroup.appendChild(button)
      }
    })
  }

  // return callback so that disabling after redirecting from file page to non-page works properly
  return () => {
    const buttons = document.querySelectorAll(`.${copyFileButtonClassName}`)
    buttons.forEach(button => {
      button.parentElement?.removeChild(button)
    })
  }
}

export function attachCopySnippet() {
  const readmeSelector = '.repository-content div#readme'
  return $(readmeSelector, () => {
    const readmeArticleSelector = '.repository-content div#readme article'
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
          const buttons = document.querySelectorAll(`.${ClippyClassName}`)
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
