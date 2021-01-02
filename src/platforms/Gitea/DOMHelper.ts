import { raiseError } from 'analytics'
import { $ } from 'utils/DOMHelper'

export function isInRepoPage() {
  const repoHeaderSelector = '.repo-header'
  return Boolean($(repoHeaderSelector))
}

export function isInCodePage() {
  const branchListSelector = '.reference'
  return Boolean($(branchListSelector))
}

export function getCurrentBranch() {
  const branchListSelector = '.reference'
  const branchButtonElement: HTMLElement = $(branchListSelector)
  const branchNameElement = branchButtonElement.querySelector('.selected')
  if (branchNameElement) {
    return branchNameElement.textContent;
  }

  raiseError(new Error('cannot get current branch'))
}

