import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import { platform } from 'platforms'
import { Config } from 'utils/configHelper'
import * as DOMHelper from 'utils/DOMHelper'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export type Props = {
  treeRoot?: TreeNode
  metaData: MetaData
  freeze: boolean
  accessToken: string | undefined
  toggleShowSettings: React.MouseEventHandler
  config: Config
  loadWithPJAX(url: string): void
}

export type ConnectorState = {
  state: 'pulling' | 'rendering' | 'done'
  visibleNodes: VisibleNodes | null
  searchKey: string
  searched: boolean // derived state from searchKey, = !!searchKey

  handleKeyDown: GetCreatedMethod<typeof handleKeyDown>
  search: GetCreatedMethod<typeof search>
  onNodeClick: GetCreatedMethod<typeof onNodeClick>
  onFocusSearchBar: GetCreatedMethod<typeof onFocusSearchBar>
  setUpTree: GetCreatedMethod<typeof setUpTree>
  goTo: GetCreatedMethod<typeof goTo>
  expandTo: GetCreatedMethod<typeof expandTo>
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

type Task = () => void
let visibleNodesGenerator: VisibleNodesGenerator

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

export const setUpTree: BoundMethodCreator<[
  Pick<Props, 'treeRoot' | 'metaData'> & { config: Config },
]> = dispatch => async ({ treeRoot, metaData, config }) => {
  if (!treeRoot) return
  dispatch.set({ state: 'rendering' })

  const { compressSingletonFolder } = config

  visibleNodesGenerator = new VisibleNodesGenerator({
    root: treeRoot,
    compress: compressSingletonFolder,
    async getTreeData(path) {
      const { root } = await platform.getTreeData(metaData, path, false, config.access_token)
      return root
    },
  })
  visibleNodesGenerator.onUpdate(visibleNodes => dispatch.set({ visibleNodes }))

  dispatch.set({ state: 'done' })

  if (platform.shouldExpandAll?.()) {
    visibleNodesGenerator.visibleNodes.nodes.forEach(node =>
      dispatch.call(toggleNodeExpansion, node, { recursive: true }),
    )
  } else {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) dispatch.call(goTo, targetPath)
  }
}

export const handleKeyDown: BoundMethodCreator<[React.KeyboardEvent]> = dispatch => event => {
  const [{ searched, visibleNodes }, { loadWithPJAX }] = dispatch.get()
  if (!visibleNodes) return
  const { nodes, focusedNode, expandedNodes } = visibleNodes
  function handleVerticalMove(index: number) {
    if (0 <= index && index < nodes.length) {
      DOMHelper.focusFileExplorer()
      dispatch.call(focusNode, nodes[index])
    } else {
      DOMHelper.focusSearchInput()
      dispatch.call(focusNode, null)
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
        if (expandedNodes.has(focusedNode.path)) {
          dispatch.call(setExpand, focusedNode, false)
        } else {
          // go forward to the start of the list, find the closest node with lower depth
          const parentNode = getVisibleParentNode(nodes, focusedNode)
          if (parentNode) {
            dispatch.call(focusNode, parentNode)
          }
        }
        break

      // consider the two keys as 'confirm' key
      case 'ArrowRight':
        // expand node or focus on first content node or redirect to file page
        if (focusedNode.type === 'tree') {
          if (expandedNodes.has(focusedNode.path)) {
            const nextNode = nodes[focusedNodeIndex + 1]
            if (focusedNode.contents?.includes(nextNode)) {
              dispatch.call(focusNode, nextNode)
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
          dispatch.call(focusNode, nodes[0])
          break
        case 'ArrowUp':
          DOMHelper.focusFileExplorer()
          dispatch.call(focusNode, nodes[nodes.length - 1])
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

export const onFocusSearchBar: BoundMethodCreator = dispatch => () => dispatch.call(focusNode, null)

export const search: BoundMethodCreator<[string]> = dispatch => searchKey => {
  dispatch.set({ searchKey, searched: searchKey !== '' })
  visibleNodesGenerator.search({ searchKey })
}

export const goTo: BoundMethodCreator<[string[]]> = dispatch => currentPath => {
  dispatch.set({ searchKey: '', searched: false })
  visibleNodesGenerator.search(null)
  dispatch.call(expandTo, currentPath)
}

export const setExpand: BoundMethodCreator<[TreeNode, boolean]> = dispatch => async (
  node,
  expand = false,
) => {
  await visibleNodesGenerator.setExpand(node, expand)
  dispatch.call(focusNode, node)
}

export const toggleNodeExpansion: BoundMethodCreator<[
  TreeNode,
  {
    recursive?: boolean
  },
]> = dispatch => async (node, { recursive = false }) => {
  visibleNodesGenerator.focusNode(node)
  await visibleNodesGenerator.toggleExpand(node, recursive)
}

export const focusNode: BoundMethodCreator<[TreeNode | null]> = dispatch => (
  node: TreeNode | null,
) => {
  visibleNodesGenerator.focusNode(node)
}

export const onNodeClick: BoundMethodCreator<[
  React.MouseEvent<HTMLElement, MouseEvent>,
  TreeNode,
]> = dispatch => (event, node) => {
  const preventDefault = !(node.type === 'blob' && node.url?.includes('#'))
  if (preventDefault) event.preventDefault()

  if (node.type === 'tree') {
    const [
      ,
      {
        config: { recursiveToggleFolder },
      },
    ] = dispatch.get()
    const recursive =
      (recursiveToggleFolder === 'shift' && event.shiftKey) ||
      (recursiveToggleFolder === 'alt' && event.altKey)
    dispatch.call(toggleNodeExpansion, node, { recursive })
  } else if (node.type === 'blob') {
    const [, { loadWithPJAX }] = dispatch.get()
    dispatch.call(focusNode, node)
    if (node.url && !node.url.includes('#')) {
      loadWithPJAX(node.url)
    }
  } else if (node.type === 'commit') {
    if (node.url) {
      window.open(node.url, '_blank')
    }
  }
}

export const expandTo: BoundMethodCreator<[string[]]> = dispatch => async currentPath => {
  const nodeExpandedTo = await visibleNodesGenerator.expandTo(currentPath.join('/'))
  if (nodeExpandedTo) {
    visibleNodesGenerator.focusNode(nodeExpandedTo)
  }
}
