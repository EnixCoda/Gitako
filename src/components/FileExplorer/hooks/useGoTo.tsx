import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useGoTo(
  visibleNodesGenerator: VisibleNodesGenerator | null,
  updateSearchKey: React.Dispatch<React.SetStateAction<string>>,
  expandTo: (currentPath: string[]) => Promise<void>,
) {
  return React.useCallback(
    (path: string[]) => {
      if (!visibleNodesGenerator) return

      updateSearchKey('')
      visibleNodesGenerator.search(null)
      visibleNodesGenerator.onNextUpdate(() => expandTo(path))
    },
    [visibleNodesGenerator, updateSearchKey, expandTo],
  )
}
