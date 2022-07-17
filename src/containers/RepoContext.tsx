import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useEffectOnSerializableUpdates } from 'utils/hooks/useEffectOnSerializableUpdates'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useStateIO } from 'utils/hooks/useStateIO'
import { useCatchNetworkError } from '../utils/hooks/useCatchNetworkError'
import { SideBarStateContext } from './SideBarState'
import { useInspector } from './StateInspector'

export const RepoContext = React.createContext<MetaData | null>(null)

export function RepoContextWrapper({ children }: React.PropsWithChildren<{}>) {
  const partialMetaData = usePartialMetaData()
  const defaultBranch = useDefaultBranch(partialMetaData)
  const metaData = useMetaData(partialMetaData, defaultBranch)
  useInspector(
    'RepoContext',
    React.useMemo(
      () => ({
        partialMetaData,
        defaultBranch,
        metaData,
      }),
      [partialMetaData, defaultBranch, metaData],
    ),
  )
  const state = useLoadedContext(SideBarStateContext).value
  if (state === 'disabled') return null

  return <RepoContext.Provider value={metaData}>{children}</RepoContext.Provider>
}

function resolvePartialMetaData() {
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
  const isGettingAccessToken = $state.value === 'getting-access-token' // will be false after getting access token and trigger meta-resolve progress
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

function useBranchName(): MetaData['branchName'] | null {
  // sync along URL and DOM
  const $branchName = useStateIO(() => platform.resolvePartialMetaData()?.branchName || null)
  useAfterRedirect(() =>
    $branchName.onChange(platform.resolvePartialMetaData()?.branchName || null),
  )
  return $branchName.value
}

function useDefaultBranch(partialMetaData: PartialMetaData | null) {
  const { accessToken } = useConfigs().value
  const $state = useLoadedContext(SideBarStateContext)
  const $defaultBranch = useStateIO<string | null>(null)
  const catchNetworkError = useCatchNetworkError()
  React.useEffect(() => {
    catchNetworkError(async () => {
      if (!partialMetaData) return
      $state.onChange('meta-loading')
      const { userName, repoName } = partialMetaData
      if (!userName || !repoName) return

      const defaultBranch = await platform.getDefaultBranchName({ userName, repoName }, accessToken)
      $defaultBranch.onChange(defaultBranch)
    })
  }, [partialMetaData, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps
  return $defaultBranch.value
}

function useMetaData(
  partialMetaData: PartialMetaData | null,
  defaultBranchName: MetaData['defaultBranchName'] | null,
) {
  const $state = useLoadedContext(SideBarStateContext)
  const $metaData = useStateIO<MetaData | null>(null)
  const branchName = useBranchName()
  const theBranch = branchName && branchName !== defaultBranchName ? branchName : defaultBranchName
  React.useEffect(() => {
    if (partialMetaData && defaultBranchName && theBranch) {
      const { userName, repoName } = partialMetaData
      if (!userName || !repoName) return

      const safeMetaData: MetaData = {
        userName,
        repoName,
        branchName: theBranch,
        defaultBranchName,
      }
      $metaData.onChange(safeMetaData)
      $state.onChange('meta-loaded')
    } else {
      $metaData.onChange(null)
    }
  }, [partialMetaData, defaultBranchName, theBranch]) // eslint-disable-line react-hooks/exhaustive-deps
  return $metaData.value
}
