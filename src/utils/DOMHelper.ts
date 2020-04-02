/**
 * this helper helps manipulating DOM
 */

/**
 * when gitako is ready, make page's header narrower
 * or cancel it
 */
export function markGitakoReadyState(ready: boolean) {
  const readyClassName = 'gitako-ready'
  const classList = document.body.classList
  if (ready) classList.add(readyClassName)
  else classList.remove(readyClassName)
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

export function $<EE extends Element, E extends (element: EE) => any, O extends () => any>(
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
  const searchInputSelector = '.search-input input'
  $(searchInputSelector, searchInputElement => {
    if (
      document.activeElement !== searchInputElement &&
      searchInputElement instanceof HTMLElement
    ) {
      searchInputElement.focus()
    }
  })
}
