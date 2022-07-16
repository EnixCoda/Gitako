import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useFocusNode(visibleNodesGenerator: VisibleNodesGenerator) {
  return React.useCallback(
    (node: TreeNode | null) => visibleNodesGenerator.focusNode(node),
    [visibleNodesGenerator],
  )
}
