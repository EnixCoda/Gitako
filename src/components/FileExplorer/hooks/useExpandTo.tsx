import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useExpandTo(visibleNodesGenerator: VisibleNodesGenerator | null) {
  return React.useCallback(
    async (currentPath: string[]) => {
      if (!visibleNodesGenerator) return

      const nodeExpandedTo = await visibleNodesGenerator.expandTo(currentPath.join('/'))
      if (nodeExpandedTo) visibleNodesGenerator.focusNode(nodeExpandedTo)
    },
    [visibleNodesGenerator],
  )
}
