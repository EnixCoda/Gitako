import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import { platform } from 'platforms'
import { Config } from 'utils/configHelper'
import * as DOMHelper from 'utils/DOMHelper'
import { searchKeyToRegexps } from 'utils/general'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export type Props = {
  treeRoot?: TreeNode
  metaData: MetaData
  freeze: boolean
  accessToken: string | undefined
  toggleShowSettings: React.MouseEventHandler
  loadWithPJAX(url: string): void
}

export type ConnectorState = {
  state: 'pulling' | 'rendering' | 'done'
  visibleNodes: VisibleNodes | null
  searchKey: string
  searched: boolean // derived state from searchKey, = !!searchKey

  execAfterRender: GetCreatedMethod<typeof execAfterRender>
  handleKeyDown: GetCreatedMethod<typeof handleKeyDown>
  search: GetCreatedMethod<typeof search>
  onNodeClick: GetCreatedMethod<typeof onNodeClick>
  onFocusSearchBar: GetCreatedMethod<typeof onFocusSearchBar>
  setUpTree: GetCreatedMethod<typeof setUpTree>
  goTo: GetCreatedMethod<typeof goTo>
  expandTo: GetCreatedMethod<typeof expandTo>
}

function getVisibleParentNode(
  nodes: TreeNode[],
  focusedNode: TreeNode,
  depths: Map<TreeNode, number>,
) {
  const focusedNodeIndex = nodes.indexOf(focusedNode)
  const focusedNodeDepth = depths.get(focusedNode)
  let indexOfParentNode = focusedNodeIndex - 1
  let depth: number | undefined
  while (indexOfParentNode !== -1) {
    depth = depths.get(nodes[indexOfParentNode])
    if (depth === undefined || focusedNodeDepth === undefined || !(depth >= focusedNodeDepth)) {
      break
    }
    --indexOfParentNode
  }
  const parentNode = nodes[indexOfParentNode]
  return parentNode
}

type Task = () => void
const tasksAfterRender: Task[] = []
let visibleNodesGenerator: VisibleNodesGenerator

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

export const setUpTree: BoundMethodCreator<[
  Pick<Props, 'treeRoot' | 'metaData'> & Pick<Config, 'compressSingletonFolder'>,
]> = dispatch => async ({ treeRoot, metaData, compressSingletonFolder }) => {
  if (!treeRoot) return
  dispatch.set({ state: 'rendering' })

  visibleNodesGenerator = new VisibleNodesGenerator(treeRoot, {
    compress: compressSingletonFolder,
  })

  visibleNodesGenerator.init()

  tasksAfterRender.push(DOMHelper.focusSearchInput)
  dispatch.set({ state: 'done' })
  const targetPath = platform.getCurrentPath(metaData.branchName)
  if (targetPath) dispatch.call(goTo, targetPath)
}

export const execAfterRender: BoundMethodCreator = dispatch => () => {
  for (const task of tasksAfterRender) {
    task()
  }
  tasksAfterRender.length = 0
}

export const handleKeyDown: BoundMethodCreator<[React.KeyboardEvent]> = dispatch => event => {
  const [{ searched, visibleNodes }, { loadWithPJAX }] = dispatch.get()
  if (!visibleNodes) return
  const { nodes, focusedNode, expandedNodes, depths } = visibleNodes
  function handleVerticalMove(index: number) {
    if (0 <= index && index < nodes.length) {
      DOMHelper.focusFileExplorer()
      dispatch.call(focusNode, nodes[index], false)
    } else {
      DOMHelper.focusSearchInput()
      dispatch.call(focusNode, null, false)
    }
  }

  const { key } = event
  // prevent document body scrolling if the keypress results in Gitako action
  let muteEvent = true
  if (focusedNode) {
    const focusedNodeIndex = nodes.indexOf(focusedNode)
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
        if (expandedNodes.has(focusedNode.path)) {
          dispatch.call(setExpand, focusedNode, false)
        } else {
          // go forward to the start of the list, find the closest node with lower depth
          const parentNode = getVisibleParentNode(nodes, focusedNode, depths)
          if (parentNode) {
            dispatch.call(focusNode, parentNode, false)
          }
        }
        break

      // consider the two keys as 'confirm' key
      case 'ArrowRight':
        // expand node or focus on first content node or redirect to file page
        if (focusedNode.type === 'tree') {
          if (expandedNodes.has(focusedNode.path)) {
            const nextNode = nodes[focusedNodeIndex + 1]
            const d1 = depths.get(nextNode)
            const d2 = depths.get(focusedNode)
            if (d1 !== undefined && d2 !== undefined && d1 > d2) {
              dispatch.call(focusNode, nextNode, false)
            }
          } else {
            dispatch.call(setExpand, focusedNode, true)
          }
        } else if (focusedNode.type === 'blob') {
          if (focusedNode.url) loadWithPJAX(focusedNode.url)
        } else if (focusedNode.type === 'commit') {
          window.open(focusedNode.url)
        }
        break
      case 'Enter':
        // expand node or redirect to file page
        if (focusedNode.type === 'tree') {
          if (searched) {
            dispatch.call(goTo, focusedNode.path.split('/'))
          } else {
            dispatch.call(setExpand, focusedNode, true)
          }
        } else if (focusedNode.type === 'blob') {
          if (searched) dispatch.call(goTo, focusedNode.path.split('/'))
          else if (focusedNode.url) loadWithPJAX(focusedNode.url)
        } else if (focusedNode.type === 'commit') {
          window.open(focusedNode.url)
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
          dispatch.call(focusNode, nodes[0], false)
          break
        case 'ArrowUp':
          DOMHelper.focusFileExplorer()
          dispatch.call(focusNode, nodes[nodes.length - 1], false)
          break
        default:
          muteEvent = false
      }
      if (muteEvent) {
        event.preventDefault()
      }
    }
  }
}

export const onFocusSearchBar: BoundMethodCreator = dispatch => () =>
  dispatch.call(focusNode, null, false)

export const search: BoundMethodCreator<[string]> = dispatch => searchKey => {
  dispatch.set({ searchKey, searched: searchKey !== '' })
  const regexps = searchKeyToRegexps(searchKey)
  visibleNodesGenerator.search(regexps)
  dispatch.call(updateVisibleNodes)
}

export const goTo: BoundMethodCreator<[string[]]> = dispatch => async currentPath => {
  dispatch.set({ searchKey: '', searched: false })
  visibleNodesGenerator.search(null)
  dispatch.call(updateVisibleNodes)
  tasksAfterRender.push(() => {
    dispatch.call(expandTo, currentPath)
  })
}

export const setExpand: BoundMethodCreator<[TreeNode, boolean]> = dispatch => (
  node,
  expand = false,
) => {
  visibleNodesGenerator.setExpand(node, expand)
  dispatch.call(focusNode, node, false)
}

export const toggleNodeExpansion: BoundMethodCreator<[TreeNode, boolean]> = dispatch => (
  node,
  skipScrollToNode,
) => {
  visibleNodesGenerator.toggleExpand(node)
  dispatch.call(focusNode, node, skipScrollToNode)
  tasksAfterRender.push(DOMHelper.focusFileExplorer)
}

export const focusNode: BoundMethodCreator<[TreeNode | null, boolean]> = dispatch => (
  node: TreeNode | null,
) => {
  const [{ visibleNodes }] = dispatch.get()
  if (!visibleNodes) return
  visibleNodesGenerator.focusNode(node)
  dispatch.call(updateVisibleNodes)
}

export const onNodeClick: BoundMethodCreator<[
  React.MouseEvent<HTMLElement, MouseEvent>,
  TreeNode,
]> = dispatch => (event, node) => {
  let preventDefault = true
  if (node.type === 'tree') {
    dispatch.call(toggleNodeExpansion, node, true)
  } else if (node.type === 'blob') {
    const [, { loadWithPJAX }] = dispatch.get()
    dispatch.call(focusNode, node, true)
    if (node.url) {
      if (node.url.startsWith('#')) {
        preventDefault = false
      } else {
        loadWithPJAX(node.url)
      }
    }
  } else if (node.type === 'commit') {
    if (node.url) {
      window.open(node.url, '_blank')
    }
  }
  if (preventDefault) event.preventDefault()
}

export const expandTo: BoundMethodCreator<[string[]]> = dispatch => currentPath => {
  const nodeExpandedTo = visibleNodesGenerator.expandTo(currentPath.join('/'))
  if (nodeExpandedTo) {
    visibleNodesGenerator.focusNode(nodeExpandedTo)
  }
  dispatch.call(updateVisibleNodes)
}

export const updateVisibleNodes: BoundMethodCreator = dispatch => () => {
  const { visibleNodes } = visibleNodesGenerator
  dispatch.set({ visibleNodes })
}
