import * as React from 'react'
import { VisibleNodesGeneratorMethods } from './hooks/useOnVisibleNodesGeneratorReady'

export function useHandleNodeFocus({ focusNode }: VisibleNodesGeneratorMethods) {
  return React.useCallback(
    (event: React.FocusEvent<HTMLElement, Element>, node: TreeNode) => focusNode(node),
    [focusNode],
  )
}
