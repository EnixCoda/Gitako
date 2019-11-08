import { Props } from 'components/FileExplorer'
import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import * as ini from 'ini'
import { Base64 } from 'js-base64'
import * as DOMHelper from 'utils/DOMHelper'
import { findNode, searchKeyToRegexps } from 'utils/general'
import * as GitHubHelper from 'utils/GitHubHelper'
import { BlobData } from 'utils/GitHubHelper'
import * as treeParser from 'utils/treeParser'
import * as URLHelper from 'utils/URLHelper'
import { TreeNode, VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export type ConnectorState = {
  stateText: string
  visibleNodes: VisibleNodes | null
  searchKey: string
  searched: boolean // derived state from searchKey, = !!searchKey

  init: GetCreatedMethod<typeof init>
  execAfterRender: GetCreatedMethod<typeof execAfterRender>
  handleKeyDown: GetCreatedMethod<typeof handleKeyDown>
  search: GetCreatedMethod<typeof search>
  onNodeClick: GetCreatedMethod<typeof onNodeClick>
  onFocusSearchBar: GetCreatedMethod<typeof onFocusSearchBar>
  setUpTree: GetCreatedMethod<typeof setUpTree>
  goTo: GetCreatedMethod<typeof goTo>
}

type DepthMap = Map<TreeNode, number>

function getVisibleParentNode(nodes: TreeNode[], focusedNode: TreeNode, depths: DepthMap) {
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
const tasksAfterRender: (Task)[] = []
let visibleNodesGenerator: VisibleNodesGenerator

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

export const init: BoundMethodCreator = dispatch => () =>
  dispatch.call(setStateText, 'Fetching File List...')

const githubSubModuleURLRegex = {
  HTTP: /^https?:\/\/.*?$/,
  HTTPGit: /^https:\/\/github.com\/.*?\/.*?\.git$/,
  git: /^git@github.com:(.*?)\/(.*?)\.git$/,
}

function transformModuleGitURL(node: TreeNode, URL: string) {
  const matched = URL.match(githubSubModuleURLRegex.git)
  if (!matched) return
  const [_, userName, repoName] = matched
  return appendCommitPath(`https://github.com/${userName}/${repoName}`, node)
}

function cutDotGit(URL: string) {
  return URL.replace(/\.git$/, '')
}

function appendCommitPath(URL: string, node: TreeNode) {
  return URL.replace(/\/?$/, `/tree/${node.sha}`)
}

function transformModuleHTTPDotGitURL(node: TreeNode, URL: string) {
  return appendCommitPath(cutDotGit(URL), node)
}

function transformModuleHTTPURL(node: TreeNode, URL: string) {
  return appendCommitPath(URL, node)
}

type Parsed = {
  [key: string]: ParsedModule | Parsed
}

type ParsedModule = {
  path?: string
  url?: string
}

function resolveGitModules(root: TreeNode, blobData: BlobData) {
  if (blobData) {
    if (blobData.encoding === 'base64' && blobData.content && Array.isArray(root.contents)) {
      const content = Base64.decode(blobData.content)
      const parsed: Parsed = ini.parse(content)
      handleParsed(root, parsed)
    }
  }
}

function handleParsed(root: TreeNode, parsed: Parsed) {
  Object.values(parsed).forEach(value => {
    if (typeof value === 'string') return
    const { url, path } = value
    if (typeof url === 'string' && typeof path === 'string') {
      const node = findNode(root, path.split('/'))
      if (node) {
        if (githubSubModuleURLRegex.HTTPGit.test(url)) {
          node.url = transformModuleHTTPDotGitURL(node, url)
        } else if (githubSubModuleURLRegex.git.test(url)) {
          node.url = transformModuleGitURL(node, url)
        } else if (githubSubModuleURLRegex.HTTP.test(url)) {
          node.url = transformModuleHTTPURL(node, url)
        } else {
          node.accessDenied = true
        }
      } else {
        // It turns out that we did not miss any submodule after a lot of tests.
        // Turning this off.
        // raiseError(new Error(`Submodule node not found`), { path })
      }
    } else {
      handleParsed(root, value as Parsed)
    }
  })
}

export const setUpTree: BoundMethodCreator<
  [Pick<Props, 'treeData' | 'metaData' | 'compressSingletonFolder' | 'accessToken'>]
> = dispatch => async ({ treeData, metaData, compressSingletonFolder, accessToken }) => {
  if (!treeData) return
  dispatch.call(setStateText, 'Rendering File List...')
  const { root, gitModules } = treeParser.parse(treeData, metaData)

  if (gitModules) {
    if (metaData.userName && metaData.repoName && gitModules.sha) {
      const blobData = await GitHubHelper.getBlobData({
        userName: metaData.userName,
        repoName: metaData.repoName,
        sha: gitModules.sha,
        accessToken,
      })

      resolveGitModules(root as TreeNode, blobData)
    }
  }

  visibleNodesGenerator = new VisibleNodesGenerator(root as TreeNode, {
    compress: compressSingletonFolder,
  })

  visibleNodesGenerator.init()

  tasksAfterRender.push(DOMHelper.focusSearchInput)
  dispatch.call(setStateText, '')
  dispatch.call(goTo, URLHelper.getCurrentPath(metaData.branchName))
}

export const execAfterRender: BoundMethodCreator = dispatch => () => {
  for (const task of tasksAfterRender) {
    task()
  }
  tasksAfterRender.length = 0
}

export const setStateText: BoundMethodCreator<[ConnectorState['stateText']]> = dispatch => (
  text: string,
) =>
  dispatch.set({
    stateText: text,
  })

export const handleKeyDown: BoundMethodCreator<[React.KeyboardEvent]> = dispatch => event => {
  const { searched, visibleNodes } = dispatch.get()
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
        if (expandedNodes.has(focusedNode)) {
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
          if (expandedNodes.has(focusedNode)) {
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
          if (focusedNode.url) DOMHelper.loadWithPJAX(focusedNode.url)
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
          else if (focusedNode.url) DOMHelper.loadWithPJAX(focusedNode.url)
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
  visibleNodesGenerator.search([])
  tasksAfterRender.push(() => {
    const nodeExpandedTo = visibleNodesGenerator.expandTo(currentPath.join('/'))
    if (nodeExpandedTo) {
      visibleNodesGenerator.focusNode(nodeExpandedTo)
    }
    dispatch.call(updateVisibleNodes)
  })
  dispatch.set({ searchKey: '', searched: false })
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
  skipScroll = false,
) => {
  const { visibleNodes } = dispatch.get()
  if (!visibleNodes) return
  visibleNodesGenerator.focusNode(node)
  dispatch.call(updateVisibleNodes)
}

export const onNodeClick: BoundMethodCreator<[TreeNode]> = dispatch => node => {
  if (node.type === 'tree') {
    dispatch.call(toggleNodeExpansion, node, true)
  } else if (node.type === 'blob') {
    dispatch.call(focusNode, node, true)
    if (node.url) DOMHelper.loadWithPJAX(node.url)
  } else if (node.type === 'commit') {
    if (node.url) {
      window.open(node.url, '_blank')
    }
  }
}

export const updateVisibleNodes: BoundMethodCreator = dispatch => () => {
  const { visibleNodes } = visibleNodesGenerator
  dispatch.set({ visibleNodes })
}
