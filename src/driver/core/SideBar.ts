import { ConfigsContextShape } from 'containers/ConfigsContext'
import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import { errors, platform, platformName } from 'platforms'
import * as DOMHelper from 'utils/DOMHelper'
import { createPromiseQueue } from 'utils/general'

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
  // meta data for the repository
  metaData?: MetaData
  // file tree data
  treeData?: TreeNode
  state: 'loading-meta' | 'loading-tree' | 'idle' | 'error-due-to-auth' | 'disabled'
  logoContainerElement: Element | null
  defer?: boolean
} & {
  init: GetCreatedMethod<typeof init>
  setShouldShow: GetCreatedMethod<typeof setShouldShow>
  toggleShowSideBar: GetCreatedMethod<typeof toggleShowSideBar>
  toggleShowSettings: GetCreatedMethod<typeof toggleShowSettings>
}

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

const promiseQueue = createPromiseQueue()

export const init: BoundMethodCreator = dispatch => async () => {
  const leave = await promiseQueue.enter()

  try {
    dispatch.set({ state: 'loading-meta' })
    const metaData = platform.resolveMeta()
    if (!metaData) {
      dispatch.set({ state: 'disabled' })
      return
    }
    const { userName, repoName, branchName } = metaData

    DOMHelper.markGitakoReadyState(true)
    dispatch.set({
      showSettings: false,
      logoContainerElement: DOMHelper.insertLogoMountPoint(),
    })

    const {
      props: { configContext },
    } = dispatch.get()
    const { accessToken } = configContext.value

    const guessDefaultBranch = 'master' // when to switch to 'main'?
    let getTreeData = platform.getTreeData(
      {
        branchName: branchName || guessDefaultBranch,
        userName,
        repoName,
      },
      '/',
      true,
      accessToken,
    )
    getTreeData.catch(error => error) // catch it early to prevent the error being raised higher

    const defaultBranchName = await platform.getDefaultBranchName(
      { userName, repoName },
      accessToken,
    )
    if (!defaultBranchName) {
      throw new Error(`Failed resolving default branch name`)
    }

    const safeMetaData: MetaData = {
      userName,
      repoName,
      branchName: branchName || defaultBranchName,
      defaultBranchName,
    }
    dispatch.set({ metaData: safeMetaData })
    if (branchName) {
      getTreeData.catch(error => {
        dispatch.call(handleError, error)
      })
    } else if (defaultBranchName !== guessDefaultBranch && metaData.type !== 'pull') {
      // Accessing repository's non-homepage(no branch name in URL, nor in DOM)
      // We predicted its default branch to be 'master' and sent aggressive request
      // Throw that request due to the repo do not use {defaultBranchName} as default branch
      getTreeData = platform.getTreeData(
        {
          branchName: defaultBranchName,
          userName,
          repoName,
        },
        '/',
        true,
        accessToken,
      )
    }

    dispatch.set({ state: 'loading-tree' })
    const { root: treeData, defer } = await getTreeData
    dispatch.set({ state: 'idle', treeData, defer })
  } catch (err) {
    dispatch.call(handleError, err)
  }

  leave()
}

export const handleError: BoundMethodCreator<[Error]> = dispatch => async err => {
  if (err.message === errors.EMPTY_PROJECT) {
    dispatch.call(setError, 'This project seems to be empty.')
  } else if (err.message === errors.BLOCKED_PROJECT) {
    dispatch.call(setError, 'Access to the project is blocked.')
  } else if (
    err.message === errors.NOT_FOUND ||
    err.message === errors.BAD_CREDENTIALS ||
    err.message === errors.API_RATE_LIMIT
  ) {
    dispatch.set({ state: 'error-due-to-auth' })
  } else if (err.message === errors.CONNECTION_BLOCKED) {
    const { props } = dispatch.get()
    if (props.configContext.value.accessToken) {
      dispatch.call(setError, `Cannot connect to ${platformName}.`)
    } else {
      dispatch.set({ state: 'error-due-to-auth' })
    }
  } else if (err.message === errors.SERVER_FAULT) {
    dispatch.call(setError, `${platformName} server went down.`)
  } else {
    DOMHelper.markGitakoReadyState(false)
    dispatch.call(setError, 'Some thing went wrong.')
    throw err
  }
}

export const toggleShowSideBar: BoundMethodCreator = dispatch => () => {
  const {
    state: { shouldShow },
    props: { configContext },
  } = dispatch.get()
  dispatch.call(setShouldShow, !shouldShow)

  const {
    value: { intelligentToggle },
  } = configContext
  if (intelligentToggle !== null) {
    configContext.onChange({ intelligentToggle: !shouldShow })
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
