import ini from 'ini'
import DOMHelper from 'utils/DOMHelper'
import treeParser from 'utils/treeParser'
import URLHelper from 'utils/URLHelper'
import VisibleNodesGenerator from 'utils/VisibleNodesGenerator'
import GitHubHelper from 'utils/GitHubHelper'

function getVisibleParentNode(nodes, focusedNode, depths) {
  const focusedNodeIndex = nodes.indexOf(focusedNode)
  const focusedNodeDepth = depths.get(focusedNode)
  let indexOfParentNode = focusedNodeIndex - 1
  while (
    indexOfParentNode !== -1 &&
    depths.get(nodes[indexOfParentNode]) >= focusedNodeDepth
  ) {
    --indexOfParentNode
  }
  const parentNode = nodes[indexOfParentNode]
  return parentNode
}

const tasksAfterRender = []
const visibleNodesGenerator = new VisibleNodesGenerator()

const init = dispatch => () => dispatch(async () => {
  dispatch(setStateText, 'Fetching File List...')
})

function resolveGitModules(root, blobData) {
  if (blobData) {
    if (blobData.encoding === 'base64') {
      const content = atob(blobData.content)
      const parsed = ini.parse(content)
      Object.values(parsed).map(value => {
        const { url, path } = value
        // for now, handle modules at root only
        const node = root.contents.find(node => node.path === path)
        if (node) {
          node.url = url
        }
      })
    }
  }
}

const setUpTree = dispatch => () => dispatch(async (state, { treeData, metaData, compressSingletonFolder, accessToken }) => {
  if (!treeData) return
  dispatch(setStateText, 'Rendering File List...')
  const { root, gitModules } = treeParser.parse(treeData, metaData)

  if (gitModules) {
    const blobData = await GitHubHelper.getBlobData({
      userName: metaData.userName,
      repoName: metaData.repoName,
      fileSHA: gitModules.sha,
      accessToken,
    })

    resolveGitModules(root, blobData)
  }

  visibleNodesGenerator.setCompress(compressSingletonFolder)
  await visibleNodesGenerator.plantTree(root)

  tasksAfterRender.push(DOMHelper.focusSearchInput)
  dispatch(setStateText, null)
  const currentPath = URLHelper.getCurrentPath(true)
  if (currentPath.length) {
    const nodeExpandedTo = visibleNodesGenerator.expandTo(currentPath.join('/'))
    if (nodeExpandedTo) {
      visibleNodesGenerator.focusNode(nodeExpandedTo)
      const { nodes } = visibleNodesGenerator.visibleNodes
      tasksAfterRender.push(() => DOMHelper.scrollToNodeElement(nodes.indexOf(nodeExpandedTo)))
    }
  }
  dispatch(updateVisibleNodes)
})

const execAfterRender = dispatch => () => {
  for (const task of tasksAfterRender) {
    task()
  }
  tasksAfterRender.length = 0
}

const setStateText = dispatch => text => dispatch({
  stateText: text,
})

const handleKeyDown = dispatch => ({ key }) => dispatch(({ visibleNodes: { nodes, focusedNode, expandedNodes, depths } }) => {
  if (focusedNode) {
    const focusedNodeIndex = nodes.indexOf(focusedNode)
    switch (key) {
      case 'ArrowUp':
        // focus on previous node
        if (focusedNodeIndex === 0) {
          dispatch(focusNode, nodes[nodes.length - 1])
        } else {
          dispatch(focusNode, nodes[focusedNodeIndex - 1])
        }
        break

      case 'ArrowDown':
        // focus on next node
        if (focusedNodeIndex + 1 < nodes.length) {
          dispatch(focusNode, nodes[focusedNodeIndex + 1])
        } else {
          dispatch(focusNode, nodes[0])
        }
        break

      case 'ArrowLeft':
        // collapse node or go to parent node
        if (expandedNodes.has(focusedNode)) {
          dispatch(setExpand, focusedNode, false)
        } else {
          // go forward to the start of the list, find the closest node with lower depth
          const parentNode = getVisibleParentNode(nodes, focusedNode, depths)
          if (parentNode) {
            dispatch(focusNode, parentNode)
          }
        }
        break

      // consider the two keys as 'confirm' key
      case 'ArrowRight':
        // expand node or focus on first content node or redirect to file page
        if (focusedNode.type === 'tree') {
          if (expandedNodes.has(focusedNode)) {
            const nextNode = nodes[focusedNodeIndex + 1]
            if (depths.get(nextNode) > depths.get(focusedNode)) {
              dispatch(focusNode, nextNode)
            }
          } else {
            dispatch(setExpand, focusedNode, true)
          }
        } else if (focusedNode.type === 'blob') {
          DOMHelper.loadWithPJAX(focusedNode.url)
        } else if (focusedNode.type === 'commit') {
          // redirect to its parent folder
          window.open(focusedNode.url)
        }
        break
      case 'Enter':
        // expand node or redirect to file page
        if (focusedNode.type === 'tree') {
          dispatch(setExpand, focusedNode, true)
        } else if (focusedNode.type === 'blob') {
          DOMHelper.loadWithPJAX(focusedNode.url)
        } else if (focusedNode.type === 'commit') {
          // redirect to its parent folder
          window.open(focusedNode.url)
        }
        break

    }
  } else {
    // now search input is focused
    if (nodes.length) {
      switch (key) {
        case 'ArrowDown':
          dispatch(focusNode, nodes[0])
          break
        case 'ArrowUp':
          dispatch(focusNode, nodes[nodes.length - 1])
          break
      }
    }
  }
})

const handleSearchKeyChange = dispatch => {
  let i = 0
  return async event => {
    const searchKey = event.target.value
    const j = i += 1
    await visibleNodesGenerator.search(searchKey)
    if (i === j) dispatch(updateVisibleNodes)
  }
}

const delayExpandThreshold = 400
function shouldDelayExpand(node) {
  return visibleNodesGenerator.visibleNodes.expandedNodes.has(node)
    && node.contents.length > delayExpandThreshold
}

const setExpand = dispatch => (node, expand) => {
  visibleNodesGenerator.setExpand(node, expand)
  const applyChanges = () => {
    dispatch(focusNode, node)
    tasksAfterRender.push(DOMHelper.focusSearchInput)
  }
  if (shouldDelayExpand(node)) {
    dispatch(mountExpandingIndicator, node)
    tasksAfterRender.push(() => setTimeout(applyChanges, 0))
  } else {
    applyChanges()
  }
}

const toggleNodeExpansion = dispatch => (node, skipScrollToNode) => {
  visibleNodesGenerator.toggleExpand(node)
  const applyChanges = () => {
    dispatch(focusNode, node, skipScrollToNode)
    tasksAfterRender.push(DOMHelper.focusFileExplorer)
  }
  if (shouldDelayExpand(node)) {
    dispatch(mountExpandingIndicator, node)
    tasksAfterRender.push(() => setTimeout(applyChanges, 0))
  } else {
    applyChanges()
  }
}

const focusNode = dispatch => (node, skipScroll) => dispatch(({ visibleNodes: { nodes } }) => {
  visibleNodesGenerator.focusNode(node)
  if (node && !skipScroll) {
    // when focus a node not in viewport(by keyboard), scroll to it
    const indexOfToBeFocusedNode = nodes.indexOf(node)
    tasksAfterRender.push(() => DOMHelper.scrollToNodeElement(indexOfToBeFocusedNode))
    tasksAfterRender.push(DOMHelper.focusSearchInput)
  }
  dispatch(updateVisibleNodes)
})

const onNodeClick = dispatch => (node) => dispatch((state, { metaData, accessToken }) => {
  if (node.type === 'tree') {
    dispatch(toggleNodeExpansion, node, true)
  } else if (node.type === 'blob') {
    dispatch(focusNode, node, true)
    DOMHelper.loadWithPJAX(node.url)
  } else if (node.type === 'commit') {
    window.open(node.url, '_blank')
  }
})

const mountExpandingIndicator = dispatch => node => dispatch(({ visibleNodes }) => {
  const dummyVisibleNodes = {
    ...visibleNodes,
    nodes: visibleNodes.nodes.slice(),
  }
  dummyVisibleNodes.nodes.splice(
    dummyVisibleNodes.nodes.indexOf(node) + 1,
    0,
    { virtual: true, name: 'Loading', path: '-' },
  )
  return {
    visibleNodes: dummyVisibleNodes
  }
})

const updateVisibleNodes = dispatch => () => {
  const { visibleNodes } = visibleNodesGenerator
  dispatch({ visibleNodes })
}

export default {
  init,
  setUpTree,
  execAfterRender,
  setStateText,
  handleKeyDown,
  handleSearchKeyChange,
  setExpand,
  toggleNodeExpansion,
  focusNode,
  onNodeClick,
  updateVisibleNodes,
  mountExpandingIndicator,
}
