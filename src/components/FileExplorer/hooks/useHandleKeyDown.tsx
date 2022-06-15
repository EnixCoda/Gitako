import * as React from 'react'
import * as DOMHelper from 'utils/DOMHelper'
import { OperatingSystems, os } from 'utils/general'
import { loadWithPJAX } from 'utils/hooks/usePJAX'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { AlignMode } from '../useVirtualScroll'
import { VisibleNodesGeneratorMethods } from './useVisibleNodesGeneratorMethods'

function wouldBlockHistoryNavigation(event: React.KeyboardEvent) {
  // Cmd + left/right on macOS
  // Alt + left/right on other OSes
  return (
    (os === OperatingSystems.macOS && event.metaKey) ||
    (os !== OperatingSystems.macOS && event.altKey)
  )
}

function getVisibleParentNode(nodes: TreeNode[], focusedNode: TreeNode) {
  let index = nodes.findIndex(node => node.path === focusedNode.path) - 1
  while (index >= 0) {
    if (nodes[index].contents?.includes(focusedNode)) {
      return nodes[index]
    }
    --index
  }
}

export function useHandleKeyDown(
  visibleNodes: VisibleNodes,
  { focusNode, toggleExpansion, goTo }: VisibleNodesGeneratorMethods,
  searched: boolean,
  setAlignMode: (mode: AlignMode) => void,
) {
  return React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const { nodes, focusedNode, expandedNodes } = visibleNodes

      const handleVerticalMove = (index: number) => {
        if (0 <= index && index < nodes.length) {
          DOMHelper.focusFileExplorer()
          setAlignMode('lazy')
          focusNode(nodes[index])
        } else {
          DOMHelper.focusSearchInput()
          focusNode(null)
        }
      }

      const { key } = event
      // prevent document body scrolling if the keypress results in Gitako action
      let muteEvent = true
      if (focusedNode) {
        const focusedNodeIndex = nodes.findIndex(node => node.path === focusedNode.path)
        switch (key) {
          case 'ArrowUp':
            // focus on previous node
            handleVerticalMove(focusedNodeIndex - 1)
            break

          case 'ArrowDown':
            // focus on next node
            handleVerticalMove(focusedNodeIndex + 1)
            break

          case 'ArrowLeft':
            if (wouldBlockHistoryNavigation(event)) {
              muteEvent = false
              break
            }
            if (expandedNodes.has(focusedNode.path)) {
              toggleExpansion(focusedNode, { recursive: event.altKey })
              setAlignMode('lazy')
            } else {
              // go forward to the start of the list, find the closest node with lower depth
              const parentNode = getVisibleParentNode(nodes, focusedNode)
              if (parentNode) {
                focusNode(parentNode)
                setAlignMode('lazy')
              }
            }
            break

          // consider the two keys as 'confirm' key
          case 'ArrowRight':
            if (wouldBlockHistoryNavigation(event)) {
              muteEvent = false
              break
            }
            // expand node or focus on first content node or redirect to file page
            if (focusedNode.type === 'tree') {
              if (expandedNodes.has(focusedNode.path)) {
                const nextNode = nodes[focusedNodeIndex + 1]
                if (focusedNode.contents?.includes(nextNode)) {
                  focusNode(nextNode)
                  setAlignMode('lazy')
                }
              } else {
                toggleExpansion(focusedNode, { recursive: event.altKey })
              }
            } else if (focusedNode.type === 'blob') {
              const focusedNodeElement = DOMHelper.findNodeElement(focusedNode, event.currentTarget)
              if (focusedNodeElement && focusedNode.url)
                loadWithPJAX(focusedNode.url, focusedNodeElement)
            } else if (focusedNode.type === 'commit') {
              window.open(focusedNode.url)
            }
            break
          case 'Enter':
            // expand node or redirect to file page
            if (searched) {
              goTo(focusedNode.path.split('/'))
              setAlignMode('top')
            } else {
              if (focusedNode.type === 'tree') {
                toggleExpansion(focusedNode, { recursive: event.altKey })
              } else if (focusedNode.type === 'blob') {
                const focusedNodeElement = DOMHelper.findNodeElement(
                  focusedNode,
                  event.currentTarget,
                )
                if (focusedNodeElement && focusedNode.url)
                  loadWithPJAX(focusedNode.url, focusedNodeElement)
              } else if (focusedNode.type === 'commit') {
                window.open(focusedNode.url)
              }
            }
            break
          default:
            muteEvent = false
        }
        if (muteEvent) {
          event.preventDefault()
        }
      } else {
        // now search input is focused
        if (nodes.length) {
          switch (key) {
            case 'ArrowDown':
              DOMHelper.focusFileExplorer()
              focusNode(nodes[0])
              break
            case 'ArrowUp':
              DOMHelper.focusFileExplorer()
              focusNode(nodes[nodes.length - 1])
              break
            default:
              muteEvent = false
          }
          if (muteEvent) {
            event.preventDefault()
          }
        }
      }
    },
    [visibleNodes, searched, goTo, focusNode, toggleExpansion, setAlignMode],
  )
}
