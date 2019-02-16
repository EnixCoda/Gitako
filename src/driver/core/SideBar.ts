import DOMHelper, { REPO_TYPE_PRIVATE } from 'utils/DOMHelper'
import GitHubHelper, {
  NOT_FOUND,
  BAD_CREDENTIALS,
  API_RATE_LIMIT,
  EMPTY_PROJECT,
  MetaData,
} from 'utils/GitHubHelper'
import configHelper from 'utils/configHelper'
import URLHelper from 'utils/URLHelper'
import keyHelper from 'utils/keyHelper'
import { MethodCreator, DispatchState, TriggerOtherMethod } from 'driver/connect'
import { Props, TreeData } from 'components/SideBar'
import SettingsBar from 'components/SettingsBar'

export type ConnectorState = {
  // initial width of side bar
  baseSize?: number
  // error message
  error?: string
  // whether Gitako side bar should be shown
  shouldShow?: boolean
  // whether show settings pane
  showSettings?: boolean
  // whether failed loading the repo due to it is private
  errorDueToAuth?: boolean
  // access token for GitHub
  accessToken?: string
  // the shortcut string for toggle sidebar
  toggleShowSideBarShortcut?: string
  // meta data for the repository
  metaData: MetaData
  // file tree data
  treeData: TreeData
  // few settings
  compressSingletonFolder?: boolean
  copyFileButton?: boolean
  copySnippetButton?: boolean
  logoContainerElement: HTMLElement | null

  init: () => void
  onPJAXEnd: () => void
  toggleShowSideBar: () => void
  toggleShowSettings: () => void
  onAccessTokenChange: SettingsBar['props']['onAccessTokenChange']
  onKeyDown: EventListener
  onShortcutChange: SettingsBar['props']['onShortcutChange']
  setCopyFile: SettingsBar['props']['setCopyFile']
  setCopySnippet: SettingsBar['props']['setCopySnippet']
  setCompressSingleton: SettingsBar['props']['setCompressSingleton']
}

const init: MethodCreator<Props> = dispatch => async () => {
  try {
    if (!URLHelper.isInRepoPage()) return
    dispatch.state({
      logoContainerElement: DOMHelper.insertLogoMountPoint(),
    })
    let detectedBranchName
    const metaData = URLHelper.parse()
    if (DOMHelper.isInCodePage()) {
      detectedBranchName = DOMHelper.getCurrentBranch() || URLHelper.parseSHA() // not working well with non-branch blob // cannot handle '/' split branch name, should not use when possibly on branch page
    }
    metaData.branchName = detectedBranchName || 'master'
    dispatch.for(setMetaData, metaData)
    const {
      access_token: accessToken,
      shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
    } = await configHelper.get()
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
    dispatch.state({
      accessToken,
      toggleShowSideBarShortcut: shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
    })

    if (!metaData.branchName || !metaData.userName) return
    const getTreeDataAggressively = GitHubHelper.getTreeData({
      branchName: metaData.branchName,
      userName: metaData.userName,
      repoName: metaData.repoName,
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
      // Accessing repository's non-homepage(no branch name in URL, nor in DOM)
      // We predicted its default branch to be 'master' and sent aggressive request
      // Throw that request due to the repo do not use {defaultBranchName} as default branch
      metaData.branchName = projectDefaultBranchName
      getTreeData = GitHubHelper.getTreeData({
        branchName: metaData.branchName,
        userName: metaData.userName,
        repoName: metaData.repoName,
        accessToken,
      })
    } else {
      caughtAggressiveError.then(error => {
        // aggressive requested correct branch but ends in failure (e.g. project is empty)
        if (error instanceof Error) {
          dispatch.for(handleError, error)
        }
      })
    }
    getTreeData
      .then(treeData => {
        if (treeData) {
          // in an unknown rare case this NOT happen
          dispatch.state({ treeData })
        }
      })
      .catch(err => dispatch.for(handleError, err))
    Object.assign(metaData, { api: metaDataFromAPI })
    dispatch.for(setMetaData, metaData)
    const shouldShow = URLHelper.isInCodePage(metaData)
    dispatch.for(setShouldShow, shouldShow)
  } catch (err) {
    dispatch.for(handleError, err)
  }
}

const handleError: MethodCreator = dispatch => async err => {
  if (err.message === EMPTY_PROJECT) {
    dispatch.for(setError, 'This project seems to be empty.')
  } else if (
    err.message === NOT_FOUND ||
    err.message === BAD_CREDENTIALS ||
    err.message === API_RATE_LIMIT
  ) {
    dispatch.state({ errorDueToAuth: true })
    dispatch.for(setShowSettings, true)
    dispatch.for(setShouldShow, true)
  } else {
    dispatch.for(setError, 'Gitako ate a bug, but it should recovery soon!')
  }
}

const onPJAXEnd: MethodCreator<ConnectorState> = dispatch => () => {
  dispatch.prepare(({ metaData, copyFileButton, copySnippetButton }) => {
    DOMHelper.unmountTopProgressBar()
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
    const mergedMetaData = { ...metaData, ...URLHelper.parse() }
    dispatch.for(setShouldShow, URLHelper.isInCodePage(mergedMetaData))
    dispatch.for(setMetaData, mergedMetaData)
  })
}

const onKeyDown: MethodCreator = dispatch => e => {
  dispatch.state(({ toggleShowSideBarShortcut }: { toggleShowSideBarShortcut: string }) => {
    if (toggleShowSideBarShortcut) {
      const keys = keyHelper.parseEvent(e)
      if (keys === toggleShowSideBarShortcut) {
        dispatch.for(toggleShowSideBar)
      }
    }
  })
}

const toggleShowSideBar: MethodCreator = dispatch => () =>
  dispatch.state(({ shouldShow }: { shouldShow: boolean }) =>
    dispatch.for(setShouldShow, !shouldShow)
  )

const setShouldShow: MethodCreator = dispatch => shouldShow => {
  dispatch.state({ shouldShow }, shouldShow ? DOMHelper.focusFileExplorer : null)
  DOMHelper.setBodyIndent(shouldShow)
}

const setError: MethodCreator = dispatch => error => {
  dispatch.state({ error })
  dispatch.for(setShouldShow, false)
}

const toggleShowSettings: MethodCreator = dispatch => () =>
  dispatch.state(({ showSettings }: { showSettings: boolean }) => ({
    showSettings: !showSettings,
  }))

const setShowSettings: MethodCreator = dispatch => showSettings => dispatch.state({ showSettings })

const onAccessTokenChange: MethodCreator = dispatch => accessToken =>
  dispatch.state({ accessToken })

const onShortcutChange: MethodCreator = dispatch => shortcut =>
  dispatch.state({ toggleShowSideBarShortcut: shortcut })

const setMetaData: MethodCreator = dispatch => metaData => dispatch.state({ metaData })

const setCompressSingleton: MethodCreator = dispatch => compressSingletonFolder =>
  dispatch.state({ compressSingletonFolder })

const setCopyFile: MethodCreator = dispatch => copyFileButton => dispatch.state({ copyFileButton })

const setCopySnippet: MethodCreator = dispatch => copySnippetButton =>
  dispatch.state({ copySnippetButton })

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
