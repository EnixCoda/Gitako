import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SearchMode, searchModes } from '../../searchModes'

export function useOnSearch(
  updateSearchKey: (searchKey: string) => void,
  visibleNodesGenerator: VisibleNodesGenerator | null,
) {
  const { restoreExpandedFolders } = useConfigs().value
  return React.useCallback(
    (searchKey: string, searchMode: SearchMode) => {
      updateSearchKey(searchKey)
      if (visibleNodesGenerator) {
        visibleNodesGenerator.search(
          searchModes[searchMode].getSearchParams(searchKey),
          restoreExpandedFolders,
        )
      }
    },
    [updateSearchKey, visibleNodesGenerator, restoreExpandedFolders],
  )
}
