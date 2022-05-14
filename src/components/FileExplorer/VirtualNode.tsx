import { Node } from 'components/FileExplorer/Node'
import * as React from 'react'
import { ListChildComponentProps } from 'react-window'
import { NodeRendererContext } from '.'

export const VirtualNode = React.memo(function VirtualNode({
  index,
  style,
  data: { onNodeClick, renderLabelText, renderActions, visibleNodes },
}: Override<ListChildComponentProps, { data: NodeRendererContext }>) {
  if (!visibleNodes) return null

  const { nodes, focusedNode, expandedNodes, loading, depths } = visibleNodes
  const node = nodes[index]

  return (
    <Node
      style={style}
      key={node.path}
      node={node}
      depth={depths.get(node) || 0}
      focused={focusedNode?.path === node.path}
      loading={loading.has(node.path)}
      expanded={expandedNodes.has(node.path)}
      onClick={onNodeClick}
      renderLabelText={renderLabelText}
      renderActions={renderActions}
    />
  )
})
