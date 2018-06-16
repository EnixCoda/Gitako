import DOMHelper, { REPO_TYPE_PRIVATE } from '../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND, BAD_CREDENTIALS } from '../utils/GitHubHelper'
import storageHelper from '../utils/storageHelper'
import URLHelper from '../utils/URLHelper'
import keyHelper from '../utils/keyHelper'

export default function(dispatch) {
  const init = async () => {
    try {
      DOMHelper.decorateGitHubPageContent()
      const metaData = URLHelper.parse()
      setMetaData(metaData)
      const [accessToken, shortcut] = await Promise.all([
        storageHelper.getAccessToken(),
        storageHelper.getShortcut(),
      ])
      dispatch({ hasAccessToken: Boolean(accessToken), toggleShowSideBarShortcut: shortcut })
      const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaData, accessToken })
      const branchName = metaData.branchName || metaDataFromAPI['default_branch']
      Object.assign(metaData, { branchName, api: metaDataFromAPI })
      setMetaData(metaData)
      const shouldShow = URLHelper.isInCodePage(metaData)
      setShouldShow(shouldShow)
      if (shouldShow) {
        DOMHelper.mountTopProgressBar()
      }
      const treeData = await GitHubHelper.getTreeData({ ...metaData, accessToken })
      dispatch({ logoContainerElement: DOMHelper.insertLogo() })
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
        setShouldShow(errorDueToAuth)
      } else {
        console.error(err)
        setShouldShow(false)
      }
    }
  }

  const onPJAXEnd = () => {
    dispatch(({ metaData }) => {
      DOMHelper.mountTopProgressBar()
      const mergedMetaData = { ...metaData, ...URLHelper.parse() }
      setShouldShow(URLHelper.isInCodePage(mergedMetaData))
      setMetaData(mergedMetaData)
      DOMHelper.decorateGitHubPageContent()
      DOMHelper.focusSearchInput()
    })
  }

  const setShouldShow = shouldShow => {
    dispatch({ shouldShow })
    DOMHelper.setBodyIndent(shouldShow)
  }

  const toggleShowSideBar = () => dispatch(({ shouldShow }) => setShouldShow(!shouldShow))

  const toggleShowSettings = () => dispatch(({ showSettings }) => ({ showSettings: !showSettings }))

  const onHasAccessTokenChange = hasAccessToken => dispatch({ hasAccessToken })

  const onKeyDown = e => {
    dispatch(({ toggleShowSideBarShortcut }) => {
      if (toggleShowSideBarShortcut) {
        const keys = keyHelper.parseEvent(e)
        if (keys === toggleShowSideBarShortcut) {
          toggleShowSideBar()
        }
      }
    })
  }

  const onShortcutChange = shortcut => dispatch({ toggleShowSideBarShortcut: shortcut })

  const onResize = size => dispatch({ size })

  const setMetaData = metaData => dispatch({ metaData })

  return {
    init,
    onPJAXEnd,
    setShouldShow,
    toggleShowSideBar,
    toggleShowSettings,
    onHasAccessTokenChange,
    onKeyDown,
    onShortcutChange,
    onResize,
    setMetaData,
  }
}
