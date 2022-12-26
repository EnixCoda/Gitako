import { PropsWithChildren } from 'common'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { run } from 'utils/general'
import { useAbortableEffect } from 'utils/hooks/useAbortableEffect'
import { useEffectOnSerializableUpdates } from 'utils/hooks/useEffectOnSerializableUpdates'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import { useHandleNetworkError } from 'utils/hooks/useHandleNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarStateContext } from './SideBarState'
import { useInspector } from './StateInspector'

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
    const { userName, repoName, type } = partialMetaData
    return {
      userName,
      repoName,
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
  const $state = useLoadedContext(SideBarStateContext)
  const $metaData = useStateIO<MetaData | null>(null)

  const { accessToken } = useConfigs().value
  const handleNetworkError = useHandleNetworkError()
  useAbortableEffect(
    React.useCallback(
      signal => {
        // get default branch
        run(async () => {
          if (!partialMetaData) return

          const { userName, repoName } = partialMetaData
          if (!userName || !repoName) return

          $state.onChange('meta-loading')
          let { branchName } = partialMetaData
          if (!branchName) {
            try {
              const defaultBranchName = await platform.getDefaultBranchName(
                { userName, repoName },
                accessToken,
              )
              if (signal.aborted) return
              branchName = defaultBranchName
            } catch (err) {
              // state will be updated in the network error handler
              if (err instanceof Error) {
                handleNetworkError(err)
                return
              }

              throw err
            }
          }

          $metaData.onChange({
            userName,
            repoName,
            branchName,
          })
          $state.onChange('meta-loaded')
        })

        return () => {
          $state.onChange('disabled')
          $metaData.onChange(null)
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [partialMetaData, accessToken],
    ),
  )

  return $metaData.value
}
