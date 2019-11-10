import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import * as configHelper from 'utils/configHelper'
import { Config } from 'utils/configHelper'
import * as DOMHelper from 'utils/DOMHelper'
import * as GitHubHelper from 'utils/GitHubHelper'
import { MetaData, TreeData } from 'utils/GitHubHelper'
import * as keyHelper from 'utils/keyHelper'
import * as URLHelper from 'utils/URLHelper'

export type Props = {}

export type ConnectorState = {
  // error message
  error?: string
  // whether Gitako side bar should be shown
  shouldShow: boolean
  // whether show settings pane
  showSettings: boolean
  // whether failed loading the repo due to it is private
  errorDueToAuth: boolean
  // meta data for the repository
  metaData?: MetaData
  // file tree data
  treeData?: TreeData
  logoContainerElement: Element | null
  disabled: boolean
  initializingPromise: Promise<void> | null
} & {
  init: GetCreatedMethod<typeof init>
  onPJAXEnd: GetCreatedMethod<typeof onPJAXEnd>
  onKeyDown: GetCreatedMethod<typeof onKeyDown>
  toggleShowSideBar: GetCreatedMethod<typeof toggleShowSideBar>
  toggleShowSettings: GetCreatedMethod<typeof toggleShowSettings>
  useListeners: GetCreatedMethod<typeof useListeners>
  onAccessTokenChange: GetCreatedMethod<typeof onAccessTokenChange>
  onShortcutChange: GetCreatedMethod<typeof onShortcutChange>
  setCopyFile: GetCreatedMethod<typeof setCopyFile>
  setCopySnippet: GetCreatedMethod<typeof setCopySnippet>
  setCompressSingleton: GetCreatedMethod<typeof setCompressSingleton>
  setIntelligentToggle: GetCreatedMethod<typeof setIntelligentToggle>
} & {
  baseSize: number
  toggleShowSideBarShortcut?: string
  accessToken?: string
} & Pick<
    Config,
    'compressSingletonFolder' | 'copyFileButton' | 'copySnippetButton' | 'intelligentToggle'
  >

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

export const init: BoundMethodCreator = dispatch => async () => {
  const [{ initializingPromise }] = dispatch.get()
  if (initializingPromise) await initializingPromise

  let done: any = null // cannot use type `(() => void) | null` here
  dispatch.set({
    initializingPromise: new Promise(resolve => {
      done = () => resolve()
    }),
  })

  try {
    if (!URLHelper.isInRepoPage()) {
      dispatch.set({ disabled: true })
      return
    }
    dispatch.set({
      errorDueToAuth: false,
      showSettings: false,
      logoContainerElement: DOMHelper.insertLogoMountPoint(),
    })
    let detectedBranchName
    const metaData = URLHelper.parse()
    if (DOMHelper.isInCodePage()) {
      detectedBranchName = DOMHelper.getCurrentBranch() || URLHelper.parseSHA() // not working well with non-branch blob // cannot handle '/' split branch name, should not use when possibly on branch page
    }
    metaData.branchName = detectedBranchName || 'master'
    dispatch.call(setMetaData, metaData)
    const {
      sideBarWidth,
      access_token: accessToken,
      shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
      intelligentToggle,
    } = await configHelper.getAll()
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
    dispatch.set({
      baseSize: sideBarWidth,
      accessToken,
      toggleShowSideBarShortcut: shortcut,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
      intelligentToggle,
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
          dispatch.call(handleError, error)
        }
      })
    }
    getTreeData
      .then(treeData => {
        if (treeData) {
          // in an unknown rare case this NOT happen
          dispatch.set({ treeData })
        }
      })
      .catch(err => dispatch.call(handleError, err))
    Object.assign(metaData, { api: metaDataFromAPI })
    dispatch.call(setMetaData, metaData)
    const shouldShow =
      intelligentToggle === null ? URLHelper.isInCodePage(metaData) : intelligentToggle
    dispatch.call(setShouldShow, shouldShow)
    DOMHelper.markGitakoReadyState()
  } catch (err) {
    dispatch.call(handleError, err)
  } finally {
    if (done) done()
  }
}

export const handleError: BoundMethodCreator<[Error]> = dispatch => async err => {
  if (err.message === GitHubHelper.EMPTY_PROJECT) {
    dispatch.call(setError, 'This project seems to be empty.')
  } else if (err.message === GitHubHelper.BLOCKED_PROJECT) {
    dispatch.call(setError, 'This project is blocked.')
  } else if (
    err.message === GitHubHelper.NOT_FOUND ||
    err.message === GitHubHelper.BAD_CREDENTIALS ||
    err.message === GitHubHelper.API_RATE_LIMIT
  ) {
    dispatch.set({ errorDueToAuth: true })
    dispatch.call(setShowSettings, true)
    dispatch.call(setShouldShow, true)
  } else {
    dispatch.call(useListeners, false)
    dispatch.call(setError, 'Gitako ate a bug, but it should recovery soon!')
    throw err
  }
}

export const onPJAXEnd: BoundMethodCreator = dispatch => () => {
  const [{ metaData, copyFileButton, copySnippetButton, intelligentToggle }] = dispatch.get()
  DOMHelper.unmountTopProgressBar()
  DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
  const mergedMetaData = { ...metaData, ...URLHelper.parse() }
  dispatch.call(setMetaData, mergedMetaData)

  if (intelligentToggle === null) {
    dispatch.call(setShouldShow, URLHelper.isInCodePage(mergedMetaData))
  }
}

export const onKeyDown: BoundMethodCreator<[KeyboardEvent]> = dispatch => e => {
  const [{ toggleShowSideBarShortcut }] = dispatch.get()
  if (toggleShowSideBarShortcut) {
    const keys = keyHelper.parseEvent(e)
    if (keys === toggleShowSideBarShortcut) {
      dispatch.call(toggleShowSideBar)
    }
  }
}

export const toggleShowSideBar: BoundMethodCreator = dispatch => () => {
  const [{ intelligentToggle, shouldShow }] = dispatch.get()
  dispatch.call(setShouldShow, !shouldShow)

  if (intelligentToggle !== null) {
    dispatch.call(setIntelligentToggle, shouldShow)
  }
}

export const setShouldShow: BoundMethodCreator<
  [ConnectorState['shouldShow']]
> = dispatch => shouldShow => {
  dispatch.set({ shouldShow }, shouldShow ? DOMHelper.focusFileExplorer : undefined)
  DOMHelper.setBodyIndent(shouldShow)
}

export const setError: BoundMethodCreator<[ConnectorState['error']]> = dispatch => error => {
  dispatch.set({ error })
  dispatch.call(setShouldShow, false)
}

export const toggleShowSettings: BoundMethodCreator = dispatch => () =>
  dispatch.set(({ showSettings }) => ({
    showSettings: !showSettings,
  }))

export const setShowSettings: BoundMethodCreator<
  [ConnectorState['showSettings']]
> = dispatch => showSettings => dispatch.set({ showSettings })

export const onAccessTokenChange: BoundMethodCreator<
  [ConnectorState['accessToken']]
> = dispatch => accessToken => {
  dispatch.set({ accessToken })
  // reload when setting new accessToken
  if (accessToken) {
    dispatch.call(init)
  }
}

export const onShortcutChange: BoundMethodCreator<
  [ConnectorState['toggleShowSideBarShortcut']]
> = dispatch => shortcut => dispatch.set({ toggleShowSideBarShortcut: shortcut })

export const setMetaData: BoundMethodCreator<[ConnectorState['metaData']]> = dispatch => metaData =>
  dispatch.set({ metaData })

export const setCompressSingleton: BoundMethodCreator<
  [ConnectorState['compressSingletonFolder']]
> = dispatch => compressSingletonFolder => dispatch.set({ compressSingletonFolder })

export const setCopyFile: BoundMethodCreator<
  [ConnectorState['copyFileButton']]
> = dispatch => copyFileButton => dispatch.set({ copyFileButton })

export const setCopySnippet: BoundMethodCreator<
  [ConnectorState['copySnippetButton']]
> = dispatch => copySnippetButton => dispatch.set({ copySnippetButton })

export const setIntelligentToggle: BoundMethodCreator<
  [ConnectorState['intelligentToggle']]
> = dispatch => intelligentToggle => {
  configHelper.setOne(configHelper.configKeys.intelligentToggle, intelligentToggle)
  dispatch.set({ intelligentToggle })
}

export const useListeners: BoundMethodCreator<[boolean]> = dispatch => {
  const $onPJAXEnd = () => dispatch.call(onPJAXEnd)
  const $onKeyDown = (e: KeyboardEvent) => dispatch.call(onKeyDown, e)
  return on => {
    const [{ disabled }] = dispatch.get()
    if (on && !disabled) {
      window.addEventListener('pjax:complete', $onPJAXEnd)
      window.addEventListener('keydown', $onKeyDown)
    } else {
      window.removeEventListener('pjax:complete', $onPJAXEnd)
      window.removeEventListener('keydown', $onKeyDown)
    }
  }
}
