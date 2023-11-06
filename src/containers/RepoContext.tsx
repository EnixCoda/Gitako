import { PropsWithChildren } from 'common'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useAbortableEffect } from 'utils/hooks/useAbortableEffect'
import { useEffectOnSerializableUpdates } from 'utils/hooks/useEffectOnSerializableUpdates'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import { useHandleNetworkError } from 'utils/hooks/useHandleNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarStateContext } from './SideBarState'
import { useInspector } from './Inspector'

export const RepoContext = React.createContext<MetaData | null>(null)

export function RepoContextWrapper({ children }: PropsWithChildren) {
  const partialMetaData = usePartialMetaData()
  const metaData = useMetaData(partialMetaData)
  useInspector(
    'RepoContext',
    React.useMemo(
      () => ({
        partialMetaData,
        metaData,
      }),
      [partialMetaData, metaData],
    ),
  )
  const state = useLoadedContext(SideBarStateContext).value
  if (state === 'disabled') return null

  return <RepoContext.Provider value={metaData}>{children}</RepoContext.Provider>
}

function resolvePartialMetaData(): PartialMetaData | null {
  const partialMetaData = platform.resolvePartialMetaData()
  if (partialMetaData) {
    const { userName, repoName, branchName, type } = partialMetaData
    return {
      userName,
      repoName,
      branchName,
      type: type === 'pull' ? type : undefined,
    }
  }

  return null
}

function usePartialMetaData(): PartialMetaData | null {
  const $state = useLoadedContext(SideBarStateContext)
  // will be false after getting access token and trigger meta-resolve progress
  const isGettingAccessToken = $state.value === 'getting-access-token'
  // sync along URL and DOM
  const $partialMetaData = useStateIO(isGettingAccessToken ? null : resolvePartialMetaData)
  const $committedPartialMetaData = useStateIO($partialMetaData.value)
  const setPartialMetaData = React.useCallback(
    () => $partialMetaData.onChange(resolvePartialMetaData()),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  React.useEffect(() => {
    if (!isGettingAccessToken) setPartialMetaData()
  }, [isGettingAccessToken, setPartialMetaData])
  useAfterRedirect(setPartialMetaData)
  useEffectOnSerializableUpdates(
    $partialMetaData.value,
    JSON.stringify,
    $committedPartialMetaData.onChange,
  )
  React.useEffect(() => {
    if (!$partialMetaData.value && !isGettingAccessToken) {
      $state.onChange('disabled')
    }
  }, [$partialMetaData.value]) // eslint-disable-line react-hooks/exhaustive-deps
  return $committedPartialMetaData.value
}

function useMetaData(partialMetaData: PartialMetaData | null) {
  const [metaData, changeMetaData] = React.useState<MetaData | null>(null)
  const changeLoadedState = useLoadedContext(SideBarStateContext).onChange
  const handleNetworkError = useHandleNetworkError()

  const { accessToken } = useConfigs().value
  const loadRepoMetaData = React.useCallback(
    async function* loadRepoMetaData() {
      if (!partialMetaData) return

      const { userName, repoName } = partialMetaData
      if (!userName || !repoName) return

      changeLoadedState('meta-loading')
      let { branchName } = partialMetaData
      if (!branchName) {
        try {
          const defaultBranchName = yield await platform.getDefaultBranchName(
            { userName, repoName },
            accessToken,
          )
          branchName = defaultBranchName as string
        } catch (err) {
          // state will be updated in the network error handler
          if (err instanceof Error) return handleNetworkError(err)
          else throw err
        }
      }

      changeMetaData({
        userName,
        repoName,
        branchName,
      })
      changeLoadedState('meta-loaded')
    },
    [partialMetaData, changeLoadedState, accessToken, handleNetworkError],
  )

  useAbortableEffect(
    React.useCallback(
      () => ({
        getAsyncGenerator: loadRepoMetaData,
        cancel: () => {
          changeLoadedState('disabled')
          changeMetaData(null)
        },
      }),
      [loadRepoMetaData, changeLoadedState, changeMetaData],
    ),
  )

  return metaData
}
