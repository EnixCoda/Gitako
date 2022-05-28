import * as React from 'react'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { NodeRendererContext } from '../index'
import { useHandleNodeFocus } from '../useHandleNodeFocus'
import { useNodeRenderers } from './useNodeRenderers'
import { useHandleNodeClick } from './useOnNodeClick'
import { useRenderLabelText } from './useRenderLabelText'

export function useNodeRenderContext(
  visibleNodes: VisibleNodes | null,
  onNodeClick: ReturnType<typeof useHandleNodeClick>,
  onNodeFocus: ReturnType<typeof useHandleNodeFocus>,
  renderActions: ReturnType<typeof useNodeRenderers>,
  renderLabelText: ReturnType<typeof useRenderLabelText>,
): NodeRendererContext | null {
  return React.useMemo(
    () =>
      visibleNodes && {
        visibleNodes,
        onNodeClick,
        onNodeFocus,
        renderActions,
        renderLabelText,
      },
    [visibleNodes, onNodeClick, onNodeFocus, renderActions, renderLabelText],
  )
}
