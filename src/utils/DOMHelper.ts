/**
 * this helper helps manipulating DOM
 */

import { platformName } from 'platforms'
import { $ } from './$'

export const rootElementID = 'gitako-root'
export const gitakoDescriptionTarget = document.documentElement

// Some custom attributes added to GitHub html would be removed by GitHub when some events happen
function attachStickyAttribute(
  target: Node,
  shouldAttach: (mutation: MutationRecord) => boolean,
  attach: (mutation: MutationRecord) => void,
  mutationOptions?: MutationObserverInit,
) {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) if (shouldAttach(mutation)) attach(mutation)
  })

  observer.observe(target, {
    attributeOldValue: true,
    attributes: true,
    ...mutationOptions,
  })

  return () => observer.disconnect()
}

export const attachStickyDataAttribute = (
  target: HTMLElement,
  attributeName: string,
  attach: (mutation: MutationRecord) => void,
) =>
  attachStickyAttribute(target, () => !target.getAttribute(attributeName), attach, {
    attributeFilter: [attributeName],
  })

export const attachStickyStyle = (
  target: HTMLElement,
  styleName: string,
  attach: (mutation: MutationRecord) => void,
) =>
  attachStickyAttribute(
    target,
    () => !target.style.getPropertyValue(styleName), // `''` if not exist
    attach,
    { attributeFilter: ['style'] },
  )

/**
 * when gitako is ready, attach attribute to activate CSS selectors
 * e.g. make page's header narrower on pin sidebar
 */
const readyDataAttributeName = 'data-gitako-ready'
export const attachStickyGitakoReadyState = () =>
  attachStickyDataAttribute(gitakoDescriptionTarget, readyDataAttributeName, ({ oldValue }) =>
    markGitakoReadyState(oldValue === 'true'),
  )
export function markGitakoReadyState(ready: boolean) {
  return gitakoDescriptionTarget.setAttribute(readyDataAttributeName, `${ready}`)
}

/**
 * indicate current platform to activate specific CSS styles
 */
const platformDataAttributeName = 'data-gitako-platform'
export const attachStickyGitakoPlatform = () =>
  attachStickyDataAttribute(gitakoDescriptionTarget, platformDataAttributeName, () =>
    markGitakoPlatform(),
  )
export function markGitakoPlatform() {
  if (platformName)
    return gitakoDescriptionTarget.setAttribute(platformDataAttributeName, platformName)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
const spacingAttributeName = 'data-with-gitako-spacing'
export const attachStickyBodyIndent = () =>
  attachStickyDataAttribute(gitakoDescriptionTarget, spacingAttributeName, ({ oldValue }) =>
    setBodyIndent(oldValue === 'true'),
  )
export function setBodyIndent(shouldShowGitako: boolean) {
  gitakoDescriptionTarget.setAttribute(spacingAttributeName, `${shouldShowGitako}`)
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

const mountPointContainer = document.body
export function insertMountPoint(
  create = () => {
    const element = document.createElement('div')
    element.setAttribute('id', rootElementID)
    return element
  },
) {
  return $(formatID(rootElementID), undefined, () => mountPointContainer.appendChild(create()))
}

export function insertSideBarMountPoint() {
  const id = 'gitako-sidebar-mount-point'
  const create = () => {
    const element = document.createElement('div')
    element.setAttribute('id', id)
    return element
  }
  return $<HTMLDivElement, HTMLDivElement>(formatID(id), undefined, () =>
    insertMountPoint().appendChild(create()),
  )
}

export function insertLogoMountPoint() {
  const id = 'gitako-logo-mount-point'
  const create = () => {
    const element = document.createElement('div')
    element.setAttribute('id', id)
    return element
  }
  return $(formatID(id), undefined, () => insertMountPoint().appendChild(create()))
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

export function findNodeElement(node: TreeNode, rootElement: HTMLElement): HTMLElement | null {
  const nodeElement = rootElement.querySelector(`a[href="${node.url}"]`)
  if (nodeElement instanceof HTMLElement) return nodeElement
  return null
}

export function setCSSVariable(name: string, value: string | undefined, element: HTMLElement) {
  if (value === undefined) element.style.removeProperty(name)
  else element.style.setProperty(name, value)
}

const gitakoWidthVariable = '--gitako-width'
export const attachStickyGitakoWidthCSSVariable = (getLatestSize: () => number) =>
  attachStickyStyle(gitakoDescriptionTarget, gitakoWidthVariable, () => {
    setGitakoWidthCSSVariable(getLatestSize())
  })
export const setGitakoWidthCSSVariable = (size: number) => {
  setCSSVariable(gitakoWidthVariable, `${size}px`, gitakoDescriptionTarget)
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

export function cancelEvent(e: Event | React.BaseSyntheticEvent): void {
  e.stopPropagation()
  e.preventDefault()
}

export function onEnterKeyDown<E extends HTMLElement>(
  e: React.KeyboardEvent<E>,
  callback: (e: React.KeyboardEvent<E>) => void,
) {
  if (e.key === 'Enter') callback(e)
}
