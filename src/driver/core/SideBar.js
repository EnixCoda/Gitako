import DOMHelper, { REPO_TYPE_PRIVATE } from '../../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND, BAD_CREDENTIALS } from '../../utils/GitHubHelper'
import configHelper from '../../utils/configHelper'
import URLHelper from '../../utils/URLHelper'
import keyHelper from '../../utils/keyHelper'

const init = dispatch => async () => {
  try {
    const metaData = URLHelper.parse()
    dispatch(setMetaData, metaData)
    const { access_token: accessToken, shortcut, compressSingletonFolder } = await configHelper.get()
    dispatch({ accessToken, toggleShowSideBarShortcut: shortcut, compressSingletonFolder })
    const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaData, accessToken })
    const branchName = metaData.branchName || metaDataFromAPI['default_branch']
    Object.assign(metaData, { branchName, api: metaDataFromAPI })
    dispatch(setMetaData, metaData)
    const shouldShow = URLHelper.isInCodePage(metaData)
    dispatch(setShouldShow, shouldShow)
    if (shouldShow) {
      DOMHelper.mountTopProgressBar()
    }
    const treeData = await GitHubHelper.getTreeData({ ...metaData, accessToken })
    dispatch({ logoContainerElement: DOMHelper.insertLogoMountPoint() })
    dispatch({ treeData })
    if (shouldShow) {
      DOMHelper.unmountTopProgressBar()
    }
  } catch (err) {
    // TODO: detect request time exceeds limit
    if (err.message === NOT_FOUND || err.message === BAD_CREDENTIALS) {
      const repoPageType = await DOMHelper.getRepoPageType()
      const errorDueToAuth = repoPageType === REPO_TYPE_PRIVATE || err.message === BAD_CREDENTIALS
      dispatch({
        showSettings: repoPageType !== null,
        errorDueToAuth,
      })
      dispatch(setShouldShow, errorDueToAuth)
    } else {
      dispatch(setShouldShow, false)
    }
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
}
