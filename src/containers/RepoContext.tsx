import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useEffectOnSerializableUpdates } from 'utils/hooks/useEffectOnSerializableUpdates'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { useStateIO } from 'utils/hooks/useStateIO'
import { useCatchNetworkError } from '../utils/hooks/useCatchNetworkError'
import { SideBarStateContext } from './SideBarState'

export const RepoContext = React.createContext<MetaData | null>(null)

export function RepoContextWrapper({ children }: React.PropsWithChildren<{}>) {
  const partialMetaData = usePartialMetaData()
  const defaultBranch = useDefaultBranch(partialMetaData)
  const metaData = useMetaData(partialMetaData, defaultBranch)

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
  } else {
    return partialMetaData
  }
}

function usePartialMetaData(): PartialMetaData | null {
  const $state = useLoadedContext(SideBarStateContext)
  const isGettingAccessToken = $state.value === 'getting-access-token' // will be false after getting access token and trigger meta-resolve progress
  // sync along URL and DOM
  const $partialMetaData = useStateIO(isGettingAccessToken ? null : resolvePartialMetaData)
  const $committedPartialMetaData = useStateIO($partialMetaData.value)
  const setPartialMetaData = () => $partialMetaData.onChange(resolvePartialMetaData())
  React.useEffect(() => {
    if (!isGettingAccessToken) setPartialMetaData()
  }, [isGettingAccessToken])
  useOnPJAXDone(setPartialMetaData)
  useEffectOnSerializableUpdates(
    $partialMetaData.value,
    JSON.stringify,
    $committedPartialMetaData.onChange,
  )
  React.useEffect(() => {
    if (!$partialMetaData.value && !isGettingAccessToken) {
      $state.onChange('disabled')
    }
  }, [$partialMetaData.value])
  return $committedPartialMetaData.value
}

function useBranchName(): MetaData['branchName'] | null {
  // sync along URL and DOM
  const $branchName = useStateIO(() => platform.resolvePartialMetaData()?.branchName || null)
  useOnPJAXDone(() => $branchName.onChange(platform.resolvePartialMetaData()?.branchName || null))
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

      const defaultBranch = await platform.getDefaultBranchName(partialMetaData, accessToken)
      $defaultBranch.onChange(defaultBranch)
    })
  }, [partialMetaData, accessToken])
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
  }, [partialMetaData, defaultBranchName, theBranch])
  return $metaData.value
}
