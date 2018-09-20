import DOMHelper, { REPO_TYPE_PRIVATE } from '../../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND, BAD_CREDENTIALS } from '../../utils/GitHubHelper'
import configHelper from '../../utils/configHelper'
import URLHelper from '../../utils/URLHelper'
import keyHelper from '../../utils/keyHelper'

const init = dispatch => async () => {
  try {
    if (!URLHelper.isInRepoPage()) return
    let nothingWentWrong = true
    const metaData = URLHelper.parse()
    dispatch(setMetaData, metaData)
    const { access_token: accessToken, shortcut, compressSingletonFolder } = await configHelper.get()
    dispatch({ accessToken, toggleShowSideBarShortcut: shortcut, compressSingletonFolder })
    const defaultBranchName = 'master'
    let aggressivelyGotTreeData = GitHubHelper.getTreeData({
      ...metaData,
      branchName: metaData.branchName || defaultBranchName,
      accessToken,
    }).catch(err => {
      nothingWentWrong = false
      dispatch(handleError, err)
    })
    const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaData, accessToken })
    const projectDefaultBranchName = metaDataFromAPI['default_branch']
    if (!metaData.branchName) {
      // User accessed repo's homepage(no branch name in URL) and we predicted its default branch to be 'master'
      if (projectDefaultBranchName !== defaultBranchName) {
        // And the repo do not use {defaultBranchName} as default branch,
        aggressivelyGotTreeData = GitHubHelper.getTreeData({
          ...metaData,
          branchName: projectDefaultBranchName,
          accessToken,
        })
      }
    }
    const branchName = metaData.branchName || projectDefaultBranchName
    Object.assign(metaData, { branchName, api: metaDataFromAPI })
    dispatch(setMetaData, metaData)
    const shouldShow = URLHelper.isInCodePage(metaData)
    dispatch(setShouldShow, nothingWentWrong && shouldShow)
    aggressivelyGotTreeData
      .then(treeData => {
        dispatch({ treeData })
      })
      .catch(err => {
        dispatch(handleError, err)
      })
      .then(() => {
        dispatch({ logoContainerElement: DOMHelper.insertLogoMountPoint() })
      })
  } catch (err) {
    dispatch(handleError, err)
  } finally {
    dispatch({ logoContainerElement: DOMHelper.insertLogoMountPoint() })
  }
}

const handleError = dispatch => async (err) => {
  // TODO: detect request time exceeds limit
  if (err.message === NOT_FOUND || err.message === BAD_CREDENTIALS) {
    const repoPageType = await DOMHelper.getRepoPageType()
    const errorDueToAuth = repoPageType === REPO_TYPE_PRIVATE || err.message === BAD_CREDENTIALS
    dispatch({ errorDueToAuth })
    dispatch(setShouldShow, errorDueToAuth)
    if (!errorDueToAuth) {
      dispatch(setError, 'Gitako ate a bug, but it should recovery soon!')
    }
  } else {
    dispatch(setShouldShow, false)
    dispatch(setError, 'Gitako ate a bug, but it should recovery soon!')
  }
}

const onPJAXEnd = dispatch => () => {
  dispatch(({ metaData }) => {
    DOMHelper.unmountTopProgressBar()
    DOMHelper.decorateGitHubPageContent()
    DOMHelper.focusSearchInput()
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

const toggleShowSideBar = dispatch => () => dispatch(({ shouldShow }) => dispatch(setShouldShow, !shouldShow))

const setShouldShow = dispatch => shouldShow => {
  dispatch({ shouldShow })
  DOMHelper.setBodyIndent(shouldShow)
}

const setError = dispatch => error => {
  dispatch({ error })
}

const toggleShowSettings = dispatch => () => dispatch(({ showSettings }) => ({ showSettings: !showSettings }))

const onAccessTokenChange = dispatch => accessToken => dispatch({ accessToken })

const onShortcutChange = dispatch => shortcut => dispatch({ toggleShowSideBarShortcut: shortcut })

const setMetaData = dispatch => metaData => dispatch({ metaData })

const setCompressSingleton = dispatch => compressSingletonFolder => dispatch({ compressSingletonFolder })

export default {
  init,
  onPJAXEnd,
  onKeyDown,
  setShouldShow,
  toggleShowSideBar,
  toggleShowSettings,
  onAccessTokenChange,
  onShortcutChange,
  setMetaData,
  setCompressSingleton,
  setError,
  handleError,
}
