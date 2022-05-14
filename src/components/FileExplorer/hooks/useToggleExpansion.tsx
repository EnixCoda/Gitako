import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useToggleExpansion(visibleNodesGenerator: VisibleNodesGenerator | null) {
  return React.useCallback(
    async (
      node: TreeNode,
      {
        recursive = false,
      }: {
        recursive?: boolean
      },
    ) => {
      if (!visibleNodesGenerator) return

      if (node.type === 'tree') {
        visibleNodesGenerator.focusNode(node)
        await visibleNodesGenerator.toggleExpand(node, recursive)
      }
    },
    [visibleNodesGenerator],
  )
}
