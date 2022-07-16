import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { searchModes } from '../../searchModes'

export function useRenderLabelText(searchKey: string) {
  const { searchMode } = useConfigs().value
  return React.useCallback(
    (node: TreeNode) => searchModes[searchMode].renderNodeLabelText(node, searchKey),
    [searchKey, searchMode],
  )
}
