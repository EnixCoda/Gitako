import { ConfigsContextShape } from 'containers/ConfigsContext'
import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import { errors, platform } from 'platforms'
import * as DOMHelper from 'utils/DOMHelper'

export type Props = {
  configContext: ConfigsContextShape
}

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
  treeData?: TreeNode
  logoContainerElement: Element | null
  disabled: boolean
  initializingPromise: Promise<void> | null
} & {
  init: GetCreatedMethod<typeof init>
  setMetaData: GetCreatedMethod<typeof setMetaData>
  setShouldShow: GetCreatedMethod<typeof setShouldShow>
  toggleShowSideBar: GetCreatedMethod<typeof toggleShowSideBar>
  toggleShowSettings: GetCreatedMethod<typeof toggleShowSettings>
}

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
    const metaData = platform.resolveMeta()
    if (!metaData) {
      dispatch.set({ disabled: true })
      return
    }
    const detectedBranchName = metaData.branchName
    DOMHelper.markGitakoReadyState(true)
    dispatch.set({
      errorDueToAuth: false,
      showSettings: false,
      logoContainerElement: DOMHelper.insertLogoMountPoint(),
    })
    dispatch.call(setMetaData, metaData)

    const [, { configContext }] = dispatch.get()
    const { access_token: accessToken } = configContext.val

    if (!metaData.branchName || !metaData.userName || !metaData.repoName) return
    const getTreeDataAggressively = platform.getTreeData(
      {
        branchName: metaData.branchName,
        userName: metaData.userName,
        repoName: metaData.repoName,
      },
      accessToken,
    )
    const caughtAggressiveError = getTreeDataAggressively?.catch(error => {
      // 1. the repo has no master branch
      // 2. detect branch name from DOM failed
      // 3. not very possible...
      // not handle this error immediately
      return error
    })
    let getTreeData = getTreeDataAggressively
    const metaDataFromAPI = await platform.getMetaData(
      {
        branchName: metaData.branchName,
        userName: metaData.userName,
        repoName: metaData.repoName,
      },
      accessToken,
    )
    const projectDefaultBranchName = metaDataFromAPI?.defaultBranchName
    if (
      !detectedBranchName &&
      projectDefaultBranchName &&
      projectDefaultBranchName !== metaData.branchName
    ) {
      // Accessing repository's non-homepage(no branch name in URL, nor in DOM)
      // We predicted its default branch to be 'master' and sent aggressive request
      // Throw that request due to the repo do not use {defaultBranchName} as default branch
      metaData.branchName = projectDefaultBranchName
      getTreeData = platform.getTreeData(
        {
          branchName: metaData.branchName,
          userName: metaData.userName,
          repoName: metaData.repoName,
        },
        accessToken,
      )
    } else {
      caughtAggressiveError.then(error => {
        // aggressive requested correct branch but ends in failure (e.g. project is empty)
        if (error instanceof Error) {
          dispatch.call(handleError, error)
        }
      })
    }
    getTreeData
      .then(async treeData => {
        if (treeData) {
          dispatch.set({ treeData })
        }
      })
      .catch(err => dispatch.call(handleError, err))
    Object.assign(metaData, metaDataFromAPI)
    dispatch.call(setMetaData, metaData)
  } catch (err) {
    dispatch.call(handleError, err)
  } finally {
    if (done) done()
  }
}

export const handleError: BoundMethodCreator<[Error]> = dispatch => async err => {
  if (err.message === errors.EMPTY_PROJECT) {
    dispatch.call(setError, 'This project seems to be empty.')
  } else if (err.message === errors.BLOCKED_PROJECT) {
    dispatch.call(setError, 'This project is blocked.')
  } else if (
    err.message === errors.NOT_FOUND ||
    err.message === errors.BAD_CREDENTIALS ||
    err.message === errors.API_RATE_LIMIT
  ) {
    dispatch.set({ errorDueToAuth: true })
  } else {
    DOMHelper.markGitakoReadyState(false)
    dispatch.call(setError, 'Some thing went wrong.')
    throw err
  }
}

export const toggleShowSideBar: BoundMethodCreator = dispatch => () => {
  const [{ shouldShow }, { configContext }] = dispatch.get()
  dispatch.call(setShouldShow, !shouldShow)

  const {
    val: { intelligentToggle },
  } = configContext
  if (intelligentToggle !== null) {
    configContext.set({ intelligentToggle: !shouldShow })
  }
}

export const setShouldShow: BoundMethodCreator<[
  ConnectorState['shouldShow'],
]> = dispatch => shouldShow => {
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

export const setMetaData: BoundMethodCreator<[ConnectorState['metaData']]> = dispatch => metaData =>
  dispatch.set({ metaData })
