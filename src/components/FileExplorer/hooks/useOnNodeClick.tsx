import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { isOpenInNewWindowClick } from 'utils/general'
import { loadWithFastRedirect } from 'utils/hooks/useFastRedirect'
import { AlignMode } from '../useVirtualScroll'
import { VisibleNodesGeneratorMethods } from './useVisibleNodesGeneratorMethods'

export function useHandleNodeClick(
  { toggleExpansion, focusNode }: VisibleNodesGeneratorMethods,
  setAlignMode: (mode: AlignMode) => void,
) {
  const { recursiveToggleFolder } = useConfigs().value
  return React.useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode) => {
      setAlignMode('lazy')
      switch (node.type) {
        case 'tree': {
          const recursive =
            (recursiveToggleFolder === 'shift' && event.shiftKey) ||
            (recursiveToggleFolder === 'alt' && event.altKey)
          // recursive toggle action may conflict with browser default action
          // e.g. shift + click is the default open in new tab action on macOS
          // giving recursive toggle action higher priority than default action
          if (!recursive && isOpenInNewWindowClick(event)) return

          event.preventDefault()
          toggleExpansion(node, { recursive })
          break
        }
        case 'blob': {
          if (isOpenInNewWindowClick(event)) return

          focusNode(node)
          if (node.url) {
            const isHashLink = node.url.includes('#')
            if (!isHashLink) {
              event.preventDefault()
              loadWithFastRedirect(node.url, event.currentTarget)
            }
          }
          break
        }
        case 'commit': {
          // pass event, open in new tab thanks to the target="_blank" on the anchor element
        }
      }
    },
    [toggleExpansion, recursiveToggleFolder, focusNode, setAlignMode],
  )
}
