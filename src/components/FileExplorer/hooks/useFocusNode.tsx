import * as React from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useFocusNode(visibleNodesGenerator: VisibleNodesGenerator | null) {
  return React.useCallback(
    (node: TreeNode | null) => visibleNodesGenerator?.focusNode(node),
    [visibleNodesGenerator],
  )
}
