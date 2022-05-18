import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { FixedSizeList } from 'react-window'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { NodeRendererContext } from '.'
import { VirtualNode } from './VirtualNode'

type ListViewProps = {
  height: number
  width: number
  nodeRendererContext: NodeRendererContext
  metaData: MetaData
  expandTo: (path: string[]) => void
}

export function ListView({
  width,
  height,
  metaData,
  expandTo,
  nodeRendererContext,
}: ListViewProps) {
  const { visibleNodes } = nodeRendererContext
  const { focusedNode, nodes } = visibleNodes

  const listRef = React.useRef<FixedSizeList<NodeRendererContext>>(null)
  const index = React.useMemo(
    () =>
      width && height && focusedNode?.path
        ? nodes.findIndex(node => node.path === focusedNode.path)
        : -1,
    [focusedNode?.path, nodes, width, height],
  )
  React.useEffect(() => {
    if (listRef.current && index !== -1) listRef.current.scrollToItem(index, 'smart')
  }, [index])

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
      itemKey={(index, { visibleNodes }) => visibleNodes.nodes[index]?.path}
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
