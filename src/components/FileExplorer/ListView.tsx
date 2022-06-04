import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { Align, FixedSizeList } from 'react-window'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { useStateIO } from 'utils/hooks/useStateIO'
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

  const $mode = useStateIO<Align>('start')
  const enableScroll = width * height > 0 // these can be 0 on first render

  React.useEffect(() => {
    // - init loading
    //   - "start"
    //     - NO immediate call
    // - jump to file
    //   - "start"
    //     - NO immediate call
    // - click file/folder
    //   - not invoke
    // - navigate with keyboard
    //   - "smart"
    //     - immediate call
    if (enableScroll && listRef.current && index !== -1) {
      listRef.current.scrollToItem(index, $mode.value)
    }
  }, [enableScroll, $mode.value, index])

  React.useEffect(() => {
    if (enableScroll && $mode.value === 'start') $mode.onChange('smart')
  }, [enableScroll, $mode.value]) // eslint-disable-line react-hooks/exhaustive-deps

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
