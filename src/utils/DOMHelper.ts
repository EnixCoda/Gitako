/**
 * this helper helps manipulating DOM
 */

export function setGitakoBodyClass(className: string, enable: boolean) {
  const classList = document.body.classList
  if (enable) classList.add(className)
  else classList.remove(className)
}

/**
 * when gitako is ready, make page's header narrower
 * or cancel it
 */
export function markGitakoReadyState(ready: boolean) {
  const readyClassName = 'gitako-ready'
  return setGitakoBodyClass(readyClassName, ready)
}

export function markGitakoSafariFlag(enable = true) {
  const className = 'gitako-safari'
  return setGitakoBodyClass(className, enable)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
export const bodySpacingClassName = 'with-gitako-spacing'
export function setBodyIndent(shouldShowGitako: boolean) {
  document.body.dataset.withGitakoSpacing = shouldShowGitako ? 'true' : 'false'
  if (shouldShowGitako) {
    document.body.classList.add(bodySpacingClassName)
  } else {
    document.body.classList.remove(bodySpacingClassName)
  }
}

export function $(selector: string): HTMLElement | null
export function $<T1>(selector: string, existCallback: (element: HTMLElement) => T1): T1 | null
export function $<T1, T2>(
  selector: string,
  existCallback: (element: HTMLElement) => T1,
  otherwise: () => T2,
): T1 | T2 | null
export function $<T2>(
  selector: string,
  existCallback: undefined | null,
  otherwise: () => T2,
): HTMLElement | T2
export function $(selector: string, existCallback?: any, otherwise?: any) {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element) : element
  }
  return otherwise ? otherwise() : null
}

export function insertSideBarMountPoint() {
  const mountPointID = 'gitako-mount-point-wrapper'
  const sideBarElement = document.createElement('div')
  sideBarElement.setAttribute('data-turbo-permanent', '')
  sideBarElement.setAttribute('id', mountPointID)
  document.body.appendChild(sideBarElement)
  return sideBarElement
}

/**
 * add the logo element into DOM
 */
export function insertLogoMountPoint() {
  const logoID = 'gitako-logo-mount-point'
  const logoSelector = '#' + logoID
  return $(logoSelector, undefined, function createLogoMountPoint() {
    const logoMountElement = document.createElement('div')
    logoMountElement.setAttribute('id', logoID)
    logoMountElement.setAttribute('data-turbo-permanent', '')
    document.body.appendChild(logoMountElement)
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

export function findNodeElement(node: TreeNode, rootElement: HTMLElement): HTMLElement | null {
  const nodeElement = rootElement.querySelector(`a[href="${node.url}"]`)
  if (nodeElement instanceof HTMLElement) return nodeElement
  return null
}

export function setCSSVariable(name: string, value: string | undefined, element: HTMLElement) {
  if (value === undefined) element.style.removeProperty(name)
  else element.style.setProperty(name, value)
}

/**
 * Unlike the good-old-PJAX-time, now GitHub replaces whole body element after redirecting using turbo.
 * If move Gitako mount point from `body` to `html`, Gitako style would break because it inherits style from GitHub body.
 * The temporary solution is recovery Gitako elements once the body is removed.
 */
export function persistGitakoElements(SideBarElement: HTMLElement, logoElement: HTMLElement) {
  const observer = new MutationObserver(mutations => {
    for (const { addedNodes, removedNodes } of mutations) {
      const [addedBody, removedBody] = [addedNodes, removedNodes].map(findBodyElement)
      if (addedBody && removedBody) {
        // hard-coded list due to limited time
        // TODO: refactor in a better practice

        // migrate gitako attributes, e.g. class
        const propertiesNeedToMigrate = ['--gitako-width']
        for (const property of propertiesNeedToMigrate) {
          const oldValue = removedBody.style.getPropertyValue(property)
          if (oldValue) addedBody.style.setProperty(property, oldValue)
        }
        const cssClassesNeedToMigrate = [bodySpacingClassName]
        for (const cssClass of cssClassesNeedToMigrate) {
          if (removedBody.classList.contains(cssClass)) addedBody.classList.add(cssClass)
        }

        // move gitako elements
        if (!addedBody.contains(SideBarElement)) addedBody.appendChild(SideBarElement)
        if (removedBody.contains(SideBarElement)) removedBody.removeChild(SideBarElement)
        if (!addedBody.contains(logoElement)) addedBody.appendChild(logoElement)
        if (removedBody.contains(logoElement)) removedBody.removeChild(logoElement)
        addedBody.dataset.withGitakoSpacing = removedBody.dataset.withGitakoSpacing
      }
    }

    function findBodyElement(addedNodes: NodeList) {
      return Array.from(addedNodes).find(addedNode => addedNode instanceof HTMLBodyElement) as
        | HTMLBodyElement
        | undefined
    }
  })
  observer.observe(document.documentElement, {
    childList: true,
  })
}
