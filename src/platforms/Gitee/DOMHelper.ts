import { raiseError } from 'analytics'
import { Clippy, ClippyClassName } from 'components/Clippy'
import * as React from 'react'
import { $ } from 'utils/DOMHelper'
import { renderReact } from 'utils/general'

export function isInRepoPage() {
  const repoHeaderSelector = '.git-project-header-details'
  return Boolean($(repoHeaderSelector))
}

export function isInCodePage() {
  const branchListSelector = '#git-project-bread'
  return Boolean($(branchListSelector))
}

export function getCurrentBranch() {
  const selectedBranchButtonSelector = '#git-project-branch'
  const branchButtonElement: HTMLElement = $(selectedBranchButtonSelector)
  if (branchButtonElement) {
    const branchNameSpanElement = branchButtonElement.querySelector('.text')
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.textContent
      if (!partialBranchNameFromInnerText?.includes('…')) return partialBranchNameFromInnerText
    }
  }

  raiseError(new Error('cannot get current branch'))
}

const REPO_TYPE_PRIVATE = 'private'
const REPO_TYPE_PUBLIC = 'public'
export function getRepoPageType() {
  const headerSelector = `.git-project-title .icon-lock`
  return $(
    headerSelector,
    () => REPO_TYPE_PRIVATE,
    () => REPO_TYPE_PUBLIC,
  )
}

export function attachCopySnippet() {
  const readmeSelector = '.file_content.markdown-body'
  return $(readmeSelector, () => {
    const readmeArticleSelector = '.file_content.markdown-body .highlight'
    return $(readmeArticleSelector, readmeElement => {
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
      readmeElement.addEventListener('mouseover', mouseOverCallback)
      return () => {
        readmeElement.removeEventListener('mouseover', mouseOverCallback)
        const buttons = document.querySelectorAll(`.${ClippyClassName}`)
        buttons.forEach(button => {
          button.parentElement?.removeChild(button)
        })
      }
    })
  })
}
