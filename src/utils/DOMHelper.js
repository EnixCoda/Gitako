/**
 * this helper helps manipulating DOM
 */

import PJAX from 'pjax'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false })

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
function setBodyIndent(shouldShowGitako) {
  const spacingClassName = 'with-gitako-spacing'
  if (shouldShowGitako) {
    document.body.classList.add(spacingClassName)
  } else {
    document.body.classList.remove(spacingClassName)
  }
}

function isInCodePage() {
  const branchListSelector = '.branch-select-menu'
  const listElement = document.querySelector(branchListSelector)
  return Boolean(listElement)
}

function getBranches() {
  const branchSelector = '.branch-select-menu .select-menu-list > div .select-menu-item-text'
  const branchElements = Array.from(document.querySelectorAll(branchSelector))
  return branchElements.map(element => element.innerHTML.trim())
}

function getCurrentBranch() {
  const selectedBranchSelector = '.select-menu.branch-select-menu .select-menu-modal .select-menu-list .select-menu-item.selected svg.select-menu-item-icon + span'
  const selectedBranchElement = document.querySelector(selectedBranchSelector)
  return selectedBranchElement ? selectedBranchElement.textContent.trim() : null
}

/**
 * add the logo element into DOM
 * 
 */
function insertLogoMountPoint() {
  const logoSelector = '.gitako .gitako-logo'
  const logoElement = document.querySelector(logoSelector)
  if (logoElement) {
    return logoElement
  }
  const logoMountElement = document.createElement('div')
  logoMountElement.setAttribute('class', 'gitako-logo-mount-point')
  document.body.appendChild(logoMountElement)
  return logoMountElement
}

/**
 * content above the file navigation bar is same for all pages of the repo
 * use this function to scroll down a bit to hide them
 */
function scrollToRepoContent() {
  const fileNavigationSelector = '.file-navigation.js-zeroclipboard-container'
  const fileNavigationElement = document.querySelector(fileNavigationSelector)
  // cannot to use behavior: smooth here as it will scroll horizontally
  if (fileNavigationElement) {
    fileNavigationElement.scrollIntoView()
  } else {
    document.body.scrollIntoView()
  }
}

/**
 * scroll to index-th element in the list
 * @param {number} index index of node item in the list
 */
function scrollToNodeElement(index) {
  const nodeElementSelector = '.node-item'
  const nodeElements = document.querySelectorAll(nodeElementSelector)
  const targetElement = nodeElements[index]
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}

const pjax = new PJAX({
  elements: '.pjax-link',
  selectors: ['.repository-content'],
  scrollTo: false,
  analytics: false,
  cacheBust: false,
  forceCache: true,
})

function loadWithPJAX(URL) {
  NProgress.start()
  pjax.loadUrl(URL)
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
function getCurrentPageType() {
  const blobWrapperSelector = '.repository-content .file .blob-wrapper'
  const blobWrapperElement = document.querySelector(blobWrapperSelector)
  if (blobWrapperElement) {
    if (blobWrapperElement.querySelector('table')) {
      return PAGE_TYPES.RAW_TEXT
    }
  } else {
    const readmeSelector = '.repository-content .readme'
    const readmeElement = document.querySelector(readmeSelector)
    if (readmeElement) {
      return PAGE_TYPES.RENDERED
    }
  }
  return PAGE_TYPES.OTHERS
}

export const REPO_TYPE_PRIVATE = 'private'
export const REPO_TYPE_PUBLIC = 'public'
function getRepoPageType() {
  const headerSelector = `#js-repo-pjax-container .pagehead.repohead h1`
  const header = document.querySelector(headerSelector)
  if (header) {
    const repoPageTypes = [REPO_TYPE_PRIVATE, REPO_TYPE_PUBLIC]
    for (const repoPageType of repoPageTypes) {
      if (header.classList.contains(repoPageType)) {
        return repoPageType
      }
    }
  }
  return null
}

/**
 * add copy file content buttons to button groups
 * click these buttons will copy file content to clipboard
 */
function attachCopyFileBtn() {
  /**
   * get text content of raw text content
   */
  function getCodeElement() {
    if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
      const codeContentSelector = '.repository-content .file .data table'
      return document.querySelector(codeContentSelector)
    }
  }

  /**
   * change inner text of copy file button to give feedback
   * @param {element} copyFileBtn
   * @param {string} text
   */
  function setTempCopyFileBtnText(copyFileBtn, text) {
    copyFileBtn.innerText = text
    window.setTimeout(() => (copyFileBtn.innerText = 'Copy file'), 1000)
  }

  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    const btnGroupSelector = [
      // the button group next to navigation bar
      '.repository-content .file-navigation.js-zeroclipboard-container .BtnGroup',
      // the button group in file content header
      '.repository-content .file .file-header .file-actions .BtnGroup',
    ].join(', ')
    const btnGroups = document.querySelectorAll(btnGroupSelector)

    btnGroups.forEach(btnGroup => {
      const copyFileBtn = document.createElement('button')
      copyFileBtn.classList.add('btn', 'btn-sm', 'BtnGroup-item', 'copy-file-btn')
      copyFileBtn.innerText = 'Copy file'
      copyFileBtn.addEventListener('click', () => {
        const codeElement = getCodeElement()
        if (copyElementContent(codeElement)) {
          setTempCopyFileBtnText(copyFileBtn, 'Success!')
        } else {
          setTempCopyFileBtnText(copyFileBtn, 'Copy failed!')
        }
      })
      btnGroup.insertBefore(copyFileBtn, btnGroups.lastChild)
    })
  }
}

/**
 * copy content of a DOM element to clipboard
 * @param {element} element
 * @returns {boolean} whether copy is successful
 */
function copyElementContent(element) {
  window.getSelection().removeAllRanges()
  const range = document.createRange()
  range.selectNode(element)
  window.getSelection().addRange(range)
  const isCopySuccessful = document.execCommand('copy')
  window.getSelection().removeAllRanges()
  return isCopySuccessful
}

/**
 * create a copy file content button `clippy`
 * once mouse enters a code snippet of markdown, move clippy into it
 * user can copy the snippet's content by click it
 *
 * TODO: 'reactify' it
 */
function createClippy() {
  function setTempClippyIconFeedback(clippy, type) {
    const tempIconClassName = type === 'success' ? 'success' : 'fail'
    clippy.classList.add(tempIconClassName)
    window.setTimeout(() => {
      clippy.classList.remove(tempIconClassName)
    }, 1000)
  }

  /**
   * <div class="clippy-wrapper">
   *    <button class="clippy">
   *      <i class="octicon octicon-clippy" />
   *    </button>
   *  </div>
   */
  const clippyWrapper = document.createElement('div')
  clippyWrapper.classList.add('clippy-wrapper')
  const clippy = document.createElement('button')
  clippy.classList.add('clippy')
  const clippyIcon = document.createElement('i')
  clippyIcon.classList.add('icon')

  clippyWrapper.appendChild(clippy)
  clippy.appendChild(clippyIcon)

  // set clipboard with current code snippet element's content
  clippy.addEventListener('click', function onClippyClick() {
    if (copyElementContent(currentCodeSnippetElement)) {
      setTempClippyIconFeedback(clippy, 'success')
    } else {
      setTempClippyIconFeedback(clippy, 'fail')
    }
  })

  return clippyWrapper
}

const clippy = createClippy()

let currentCodeSnippetElement
function attachCopySnippet() {
  const readmeSelector = '.repository-content .readme article'
  const readmeElement = document.querySelector(readmeSelector)
  if (readmeElement) {
    readmeElement.addEventListener('mouseover', ({ target }) => {
      // only move clippy when mouse is over a new snippet(<pre>)
      if (target.nodeName === 'PRE') {
        if (
          currentCodeSnippetElement !== target
        ) {
          currentCodeSnippetElement = target
          /**
           *  <article>
           *    <pre></pre>     <!-- case A -->
           *    <div class="highlight">
           *      <pre></pre>   <!-- case B -->
           *    </div>
           *  </article>
           */
          target.parentNode.insertBefore(clippy, target)
        }
      }
    })
  }
}

/**
 * focus to side bar, user will be able to manipulate it with keyboard
 */
function focusFileExplorer() {
  const sideBarContentSelector = '.gitako .file-explorer'
  const sideBarElement = document.querySelector(sideBarContentSelector)
  if (sideBarElement) {
    sideBarElement.focus()
  }
}

function focusSearchInput() {
  const searchInputSelector = '.search-input'
  const searchInputElement = document.querySelector(searchInputSelector)
  if (searchInputElement) {
    if (document.activeElement !== searchInputElement) {
      searchInputElement.focus()
    }
  }
}

/**
 * simulate click on node item, for triggering pjax
 * @param {number} index
 */
function clickOnNodeElement(index = 0) {
  const nodeElementSelector = '.node-item'
  const nodeElements = document.querySelectorAll(nodeElementSelector)
  nodeElements[index].click()
}

/**
 * a combination of few above functions
 */
function decorateGitHubPageContent() {
  attachCopyFileBtn()
  attachCopySnippet()
}

function mountTopProgressBar() {
  NProgress.start()
}

function unmountTopProgressBar() {
  NProgress.done()
}

export default {
  loadWithPJAX,
  attachCopyFileBtn,
  attachCopySnippet,
  clickOnNodeElement,
  decorateGitHubPageContent,
  focusSearchInput,
  focusFileExplorer,
  getCurrentPageType,
  getRepoPageType,
  insertLogoMountPoint,
  setBodyIndent,
  scrollToNodeElement,
  scrollToRepoContent,
  mountTopProgressBar,
  unmountTopProgressBar,
  isInCodePage,
  getBranches,
  getCurrentBranch,
}
