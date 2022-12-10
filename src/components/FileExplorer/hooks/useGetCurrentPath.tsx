import { platform } from 'platforms'
import { useCallback } from 'react'

export function useGetCurrentPath({ branchName }: MetaData) {
  return useCallback(() => platform.getCurrentPath(branchName), [branchName])
}
