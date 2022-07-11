/**
 * this helper helps manipulating DOM
 */

export const rootElementID = 'gitako-root'
export const gitakoDescriptionTarget = document.documentElement

/**
 * when gitako is ready, make page's header narrower
 * or cancel it
 */
export function markGitakoReadyState(ready: boolean) {
  const readyAttributeName = 'data-gitako-ready'
  return gitakoDescriptionTarget.setAttribute(readyAttributeName, `${ready}`)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
export const spacingAttributeName = 'data-with-gitako-spacing'
export function setBodyIndent(shouldShowGitako: boolean) {
  gitakoDescriptionTarget.setAttribute(spacingAttributeName, `${shouldShowGitako}`)
}

export function $(selector: string): HTMLElement | null
export function $<T1>(selector: string, existCallback: (element: HTMLElement) => T1): T1 | null
export function $<T1, T2>(
  selector: string,
  existCallback: (element: HTMLElement) => T1,
  otherwise: () => T2,
): T1 | T2
export function $<T2>(
  selector: string,
  existCallback: undefined | null,
  otherwise: () => T2,
): HTMLElement | T2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function $(selector: string, existCallback?: any, otherwise?: any) {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element) : element
  }
  return otherwise ? otherwise() : null
}

/**
 * DOM Structure after calling the `insert*MountPoint` functions
 *
 *  <html>
 *    <body>
 *    </body>
 *    <div id={rootElementID}>
 *      <div id={sidebarMountPointID}>
 *      </div>
 *      <div id={logoMountPointID}>
 *      </div>
 *    </div>
 *  </html>
 */

const mountPointContainer = document.documentElement
export function insertMountPoint() {
  return $(formatID(rootElementID), undefined, () => {
    const element = document.createElement('div')
    element.setAttribute('id', rootElementID)
    mountPointContainer.appendChild(element)
    return element
  })
}

export function insertSideBarMountPoint() {
  const mountPointElement = insertMountPoint()
  const sidebarMountPointID = 'gitako-sidebar-mount-point'
  return $(formatID(sidebarMountPointID), undefined, () => {
    const sideBarElement = document.createElement('div')
    sideBarElement.setAttribute('id', sidebarMountPointID)
    mountPointElement.appendChild(sideBarElement)
    return sideBarElement
  })
}

export function insertLogoMountPoint() {
  const mountPointElement = insertMountPoint()
  const logoMountPointID = 'gitako-logo-mount-point'
  return $(formatID(logoMountPointID), undefined, () => {
    const logoMountElement = document.createElement('div')
    logoMountElement.setAttribute('id', logoMountPointID)
    mountPointElement.appendChild(logoMountElement)
    return logoMountElement
  })
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
export function copyElementContent(element: Element, trimLeadingSpace?: boolean): boolean {
  window.getSelection()?.removeAllRanges()

  const range = document.createRange()
  if (trimLeadingSpace) {
    // Leading spaces can be produced by embedded DOM structures
    let realWrapper: Element | null = element
    while (realWrapper?.childElementCount === 1) realWrapper = realWrapper?.firstElementChild
    if (realWrapper?.childElementCount && realWrapper.childElementCount > 1) {
      const first = realWrapper.firstElementChild
      const last = realWrapper.lastElementChild
      if (first && last) {
        range.selectNode(first)
        range.setEndAfter(last)
      }
    }
  } else {
    range.selectNode(element)
  }

  window.getSelection()?.addRange(range)
  const isCopySuccessful = document.execCommand('copy')
  window.getSelection()?.removeAllRanges()
  return isCopySuccessful
}

/**
 * focus to side bar, user will be able to manipulate it with keyboard
 */
export function focusFileExplorer() {
  const sideBarContentSelector = '.gitako-side-bar .file-explorer'
  $(sideBarContentSelector, sideBarElement => {
    if (document.activeElement !== sideBarElement && sideBarElement instanceof HTMLElement)
      sideBarElement.focus()
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

export function findNodeElement(node: TreeNode, rootElement: HTMLElement): HTMLElement | null {
  const nodeElement = rootElement.querySelector(`a[href="${node.url}"]`)
  if (nodeElement instanceof HTMLElement) return nodeElement
  return null
}

export function setCSSVariable(name: string, value: string | undefined, element: HTMLElement) {
  if (value === undefined) element.style.removeProperty(name)
  else element.style.setProperty(name, value)
}

export function formatID(id: string) {
  return `#${id}`
}

export function formatClass(className: string) {
  return `.${className}`
}

export function parseIntFromElement(e: HTMLElement): number {
  return parseInt((e.innerText || '').replace(/[^0-9]/g, ''))
}
