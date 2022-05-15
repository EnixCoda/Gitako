import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { Align as ReactWindowAlign, FixedSizeList } from 'react-window'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { NodeRendererContext } from '.'
import { VirtualNode } from './VirtualNode'

type ListViewProps = {
  height: number
  width: number
  nodeRendererContext: NodeRendererContext
  alignMode: ReactWindowAlign
  metaData: MetaData
  expandTo: (path: string[]) => void
}

export function ListView({
  width,
  height,
  metaData,
  expandTo,
  nodeRendererContext,
  alignMode,
}: ListViewProps) {
  const { visibleNodes } = nodeRendererContext
  const { focusedNode, nodes } = visibleNodes
  const listRef = React.useRef<FixedSizeList<NodeRendererContext>>(null)

  // Scroll to focused node
  React.useEffect(() => {
    if (listRef.current && focusedNode?.path) {
      const index = nodes.findIndex(node => node.path === focusedNode.path)
      if (index !== -1) {
        listRef.current.scrollToItem(index, alignMode)
      }
    }
  }, [focusedNode?.path, nodes, alignMode])

  // For some reason, removing the deps array above results in bug:
  // If scroll fast and far, then clicking on items would result in redirect
  // Not know the reason :(
  const goToCurrentItem = React.useCallback(() => {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) expandTo(targetPath)
  }, [metaData.branchName, expandTo])

  useOnLocationChange(goToCurrentItem)
  useOnPJAXDone(goToCurrentItem)

  const { compactFileTree } = useConfigs().value

  return (
    <FixedSizeList<NodeRendererContext>
      ref={listRef}
      itemKey={(index, { visibleNodes }) => visibleNodes?.nodes[index]?.path}
      itemData={nodeRendererContext}
      itemCount={visibleNodes.nodes.length}
      itemSize={compactFileTree ? 24 : 37}
      height={height}
      width={width}
    >
      {VirtualNode}
    </FixedSizeList>
  )
}
