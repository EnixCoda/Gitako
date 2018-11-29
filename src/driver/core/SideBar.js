import DOMHelper, { REPO_TYPE_PRIVATE } from 'utils/DOMHelper'
import GitHubHelper, {
  NOT_FOUND,
  BAD_CREDENTIALS,
  API_RATE_LIMIT,
  EMPTY_PROJECT,
} from 'utils/GitHubHelper'
import configHelper from 'utils/configHelper'
import URLHelper from 'utils/URLHelper'
import keyHelper from 'utils/keyHelper'

const init = dispatch => async () => {
  try {
    if (!URLHelper.isInRepoPage()) return
    dispatch({ logoContainerElement: DOMHelper.insertLogoMountPoint() })
    let detectedBranchName
    const metaData = URLHelper.parse()
    if (DOMHelper.isInCodePage()) {
      detectedBranchName = DOMHelper.getCurrentBranch() // not working well with non-branch blob
        || URLHelper.parseBlobSHA() // cannot handle '/' split branch name, should not use when possibly on branch page
    }
    metaData.branchName = detectedBranchName || 'master'
    dispatch(setMetaData, metaData)
    const {
      access_token: accessToken,
      shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
    } = await configHelper.get()
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
    dispatch({
      accessToken,
      toggleShowSideBarShortcut: shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
    })

    const getTreeDataAggressively = GitHubHelper.getTreeData({
      ...metaData,
      accessToken,
    })
    const caughtAggressiveError = getTreeDataAggressively.catch(error => {
      // 1. the repo has no master branch
      // 2. detect branch name from DOM failed
      // 3. not very possible...
      // not handle this error immediately
      return error
    })
    let getTreeData = getTreeDataAggressively
    const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaData, accessToken })
    const projectDefaultBranchName = metaDataFromAPI['default_branch']
    if (!detectedBranchName && projectDefaultBranchName !== metaData.branchName) {
      // Accessing repo's non-homepage(no branch name in URL, nor in DOM)
      // We predicted its default branch to be 'master' and sent aggressive request
      // Throw that request due to the repo do not use {defaultBranchName} as default branch
      metaData.branchName = projectDefaultBranchName
      getTreeData = GitHubHelper.getTreeData({
        ...metaData,
        accessToken,
      })
    } else {
      caughtAggressiveError.then(error => {
        // aggressive requested correct branch but ends in failure (e.g. project is empty)
        if (error instanceof Error) {
          dispatch(handleError, error)
        }
      })
    }
    getTreeData
      .then(treeData => {
        if (treeData) {
          // in an unknown rare case this NOT happen
          dispatch({ treeData })
        }
      })
      .catch(err => dispatch(handleError, err))
    Object.assign(metaData, { api: metaDataFromAPI })
    dispatch(setMetaData, metaData)
    const shouldShow = URLHelper.isInCodePage(metaData)
    dispatch(setShouldShow, shouldShow)
  } catch (err) {
    dispatch(handleError, err)
  }
}

const handleError = dispatch => async err => {
  if (err.message === EMPTY_PROJECT) {
    dispatch(setError, 'This project seems to be empty.')
  } else if (
    err.message === NOT_FOUND ||
    err.message === BAD_CREDENTIALS ||
    err.message === API_RATE_LIMIT
  ) {
    dispatch({ errorDueToAuth: true })
    dispatch(setShowSettings, true)
    dispatch(setShouldShow, true)
  } else {
    dispatch(setError, 'Gitako ate a bug, but it should recovery soon!')
  }
}

const onPJAXEnd = dispatch => () => {
  dispatch(({ metaData, copyFileButton, copySnippetButton }) => {
    DOMHelper.unmountTopProgressBar()
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
    const mergedMetaData = { ...metaData, ...URLHelper.parse() }
    dispatch(setShouldShow, URLHelper.isInCodePage(mergedMetaData))
    dispatch(setMetaData, mergedMetaData)
  })
}

const onKeyDown = dispatch => e => {
  dispatch(({ toggleShowSideBarShortcut }) => {
    if (toggleShowSideBarShortcut) {
      const keys = keyHelper.parseEvent(e)
      if (keys === toggleShowSideBarShortcut) {
        dispatch(toggleShowSideBar)
      }
    }
  })
}

const toggleShowSideBar = dispatch => () =>
  dispatch(({ shouldShow }) => dispatch(setShouldShow, !shouldShow))

const setShouldShow = dispatch => shouldShow => {
  dispatch({ shouldShow }, shouldShow ? DOMHelper.focusFileExplorer : null)
  DOMHelper.setBodyIndent(shouldShow)
}

const setError = dispatch => error => {
  dispatch({ error })
  dispatch(setShouldShow, false)
}

const toggleShowSettings = dispatch => () =>
  dispatch(({ showSettings }) => ({ showSettings: !showSettings }))

const setShowSettings = dispatch => showSettings => dispatch({ showSettings })

const onAccessTokenChange = dispatch => accessToken => dispatch({ accessToken })

const onShortcutChange = dispatch => shortcut => dispatch({ toggleShowSideBarShortcut: shortcut })

const setMetaData = dispatch => metaData => dispatch({ metaData })

const setCompressSingleton = dispatch => compressSingletonFolder =>
  dispatch({ compressSingletonFolder })

const setCopyFile = dispatch => copyFileButton => dispatch({ copyFileButton })

const setCopySnippet = dispatch => copySnippetButton => dispatch({ copySnippetButton })

export default {
  init,
  onPJAXEnd,
  onKeyDown,
  setShouldShow,
  setShowSettings,
  toggleShowSideBar,
  toggleShowSettings,
  onAccessTokenChange,
  onShortcutChange,
  setMetaData,
  setCompressSingleton,
  setCopyFile,
  setCopySnippet,
  setError,
  handleError,
}
