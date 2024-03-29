import { raiseError } from 'analytics'
import { $ } from 'utils/$'

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
  const branchButtonElement = $(branchListSelector)
  const branchNameElement = branchButtonElement?.querySelector('.text > strong')
  if (branchNameElement) {
    return branchNameElement.textContent
  }

  raiseError(new Error('cannot get current branch'))
}
