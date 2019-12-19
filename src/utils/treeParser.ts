import { getUrlForRedirect, MetaData, TreeData } from 'utils/GitHubHelper'
import { TreeNode } from './VisibleNodesGenerator'

interface RawItem {
  name?: string | null
  path?: string | null
  mode?: string | null
  type?: string | null
  url?: string | null
  sha?: string | null
}

const revert = <T extends (...args: any[]) => any>(f: T) => (...args: Parameters<T>) => !f(...args)

const isFolder = (node: TreeNode) => node.type === 'tree'
const isNotFolder = revert(isFolder)
function sortFoldersToFront(root: TreeNode) {
  function depthFirstSearch(root: TreeNode) {
    const nodes = root.contents
    if (nodes) {
      nodes.splice(0, Infinity, ...nodes.filter(isFolder), ...nodes.filter(isNotFolder))
      nodes.forEach(depthFirstSearch)
    }
    return root
  }
  return depthFirstSearch(root)
}

function findGitModules(root: TreeNode) {
  if (root.contents) {
    const modulesFile = root.contents.find(content => content.name === '.gitmodules')
    if (modulesFile) {
      return modulesFile
    }
  }
  return null
}

export function parse(treeData: TreeData, metaData: MetaData) {
  const { tree } = treeData

  // nodes are created from items and put onto tree
  const pathToNode = new Map<string, TreeNode>()
  const pathToItem = new Map<string, RawItem>()

  const root: TreeNode = { name: '', path: '', contents: [], type: 'tree' }
  pathToNode.set('', root)

  tree.forEach(item => pathToItem.set(item.path, item))
  tree.forEach(item => {
    // bottom-up search for the deepest node created
    let path = item.path
    const itemsToCreateTreeNode: RawItem[] = []
    while (path !== '' && !pathToNode.has(path)) {
      const item = pathToItem.get(path)
      if (item) {
        itemsToCreateTreeNode.push(item)
      }
      // 'a/b' -> 'a'
      // 'a' -> ''
      path = path.substring(0, path.lastIndexOf('/'))
    }

    // top-down create nodes
    while (itemsToCreateTreeNode.length) {
      const item = itemsToCreateTreeNode.pop()
      if (!item) continue
      const node = {
        ...item,
        name: item.path && item.path.replace(/^.*\//, ''),
        url:
          item.url && item.type && item.path
            ? getUrlForRedirect(metaData, item.type, item.path)
            : null,
        contents: item.type === 'tree' ? [] : null,
      } as TreeNode
      const parentNode = pathToNode.get(path)
      if (parentNode && parentNode.contents) {
        parentNode.contents.push(node)
      }
      pathToNode.set(node.path, node)
      path = node.path
    }
  })

  return {
    gitModules: findGitModules(root),
    root: sortFoldersToFront(root),
  }
}
