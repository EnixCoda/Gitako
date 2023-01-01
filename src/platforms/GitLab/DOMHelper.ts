import { raiseError } from 'analytics'
import { $ } from 'utils/$'

export function isInRepoPage() {
  const repoHeaderSelector = '.project-highlight-puc'
  return Boolean($(repoHeaderSelector))
}

export function isInCodePage() {
  const branchListSelector = '.file-holder'
  return Boolean($(branchListSelector))
}

export function getCurrentBranch() {
  const selectedBranchButtonSelector = [
    '.project-refs-form .dropdown-toggle-text',
    '.tree-ref-holder .gl-dropdown-button-text',
  ].join(',')
  const element = $(selectedBranchButtonSelector)
  if (element) {
    const partialBranchNameFromInnerText = element.textContent
    if (!partialBranchNameFromInnerText?.includes('…')) return partialBranchNameFromInnerText
  }

  raiseError(new Error('cannot get current branch'))
}

const REPO_TYPE_PRIVATE = 'private' as const
const REPO_TYPE_PUBLIC = 'public' as const
export function getRepoPageType() {
  const headerSelector = `.git-project-title .icon-lock`
  return $(
    headerSelector,
    () => REPO_TYPE_PRIVATE,
    () => REPO_TYPE_PUBLIC,
  )
}
