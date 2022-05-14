import * as React from 'react'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { NodeRendererContext } from '../index'
import { useNodeRenderers } from './useNodeRenderers'
import { useHandleNodeClick } from './useOnNodeClick'
import { useRenderLabelText } from './useRenderLabelText'

export function useNodeRenderContext(
  visibleNodes: VisibleNodes | null,
  onNodeClick: ReturnType<typeof useHandleNodeClick>,
  renderActions: ReturnType<typeof useNodeRenderers>,
  renderLabelText: ReturnType<typeof useRenderLabelText>,
): NodeRendererContext | null {
  return React.useMemo(
    () =>
      visibleNodes && {
        visibleNodes,
        onNodeClick,
        renderActions,
        renderLabelText,
      },
    [visibleNodes, onNodeClick, renderActions, renderLabelText],
  )
}
