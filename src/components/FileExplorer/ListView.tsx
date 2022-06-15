import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useStateIO } from 'utils/hooks/useStateIO'
import { NodeRendererContext } from '.'
import { Node } from './Node'
import { AlignMode, useVirtualScroll } from './useVirtualScroll'

type ListViewProps = {
  height: number
  width: number
  nodeRendererContext: NodeRendererContext
}

export function ListView({ width, height, nodeRendererContext }: ListViewProps) {
  const { onNodeClick, onNodeFocus, renderLabelText, renderActions, visibleNodes } =
    nodeRendererContext
  const { focusedNode, nodes, expandedNodes, depths, loading } = visibleNodes

  const { compactFileTree } = useConfigs().value

  const rowHeight = compactFileTree ? 24 : 37
  const totalAmount = visibleNodes.nodes.length
  const { onScroll, visibleRows, containerStyle, scrollToItem, ref } =
    useVirtualScroll<HTMLDivElement>({
      totalAmount,
      rowHeight,
      viewportHeight: height,
      overScan: 10,
    })

  const $mode = useStateIO<AlignMode>('top')
  const enableScroll = width * height > 0 // these can be 0 on first render

  const index = React.useMemo(
    () =>
      width && height && focusedNode?.path
        ? nodes.findIndex(node => node.path === focusedNode.path)
        : -1,
    [focusedNode?.path, nodes, width, height],
  )

  React.useEffect(() => {
    // - init loading
    //   - "top"
    //     - NO immediate call
    // - jump to file
    //   - "top"
    //     - NO immediate call
    // - click file/folder
    //   - not invoke
    // - navigate with keyboard
    //   - "lazy"
    //     - immediate call
    if (enableScroll && index !== -1) {
      scrollToItem?.(index, $mode.value)
    }
  }, [enableScroll, $mode.value, index, scrollToItem])

  React.useEffect(() => {
    if (enableScroll && $mode.value === 'top') $mode.onChange('lazy')
  }, [enableScroll, $mode.value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        height,
        width: '100%',
        overflow: 'auto',
      }}
      ref={ref}
      onScroll={onScroll}
    >
      <div style={containerStyle}>
        {visibleRows.map(({ row, style }) => {
          const node = nodes[row]
          return (
            <Node
              key={node.path}
              node={node}
              style={style}
              depth={depths.get(node) || 0}
              focused={focusedNode?.path === node.path}
              loading={loading.has(node.path)}
              expanded={expandedNodes.has(node.path)}
              onClick={onNodeClick}
              onFocus={onNodeFocus}
              renderLabelText={renderLabelText}
              renderActions={renderActions}
            />
          )
        })}
      </div>
    </div>
  )
}
