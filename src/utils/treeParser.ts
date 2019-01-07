import GitHubHelper, { TreeData, MetaData } from 'utils/GitHubHelper'

interface BasicItem {
  name: string | null
  path: string | null
  parent?: BasicItem | null
  mode: null
  type: string | null
  url: string | null
}

interface Folder extends BasicItem {
  contents?: Item[]
}

interface Blob extends BasicItem {
  sha: string | null
}

type Item = Folder & Blob

const nodeTemplate: Blob = {
  name: null,
  path: null,
  mode: null,
  type: null,
  sha: null,
  url: null,
}

const isFolder = (node: BasicItem) => node.type === 'tree'
const isNotFolder = (node: BasicItem) => !isFolder(node)
function sortFoldersToFront(root: Item) {
  function depthFirstSearch(root: Item) {
    const nodes = root.contents
    if (nodes) {
      nodes.splice(0, Infinity, ...nodes.filter(isFolder), ...nodes.filter(isNotFolder))
      nodes.forEach(depthFirstSearch)
    }
    return root
  }
  return depthFirstSearch(root)
}

function setParentNode(root: Item, parent: Item | null = null) {
  root.parent = parent
  if (root.contents) {
    root.contents.forEach(node => setParentNode(node, root))
  }
}

function findGitModules(root: Item) {
  if (root.contents) {
    const modulesFile = root.contents.find(content => content.name === '.gitmodules')
    if (modulesFile) {
      return modulesFile
    }
  }
  return null
}

function parse(treeData: TreeData, metaData: MetaData) {
  const { tree } = treeData

  // nodes are created from items and put onto tree
  const pathToNode = new Map()
  const pathToItem = new Map()

  const root: Item = { ...nodeTemplate, name: '', path: '', contents: [] }
  pathToNode.set('', root)

  tree.forEach(item => pathToItem.set(item.path, item))
  tree.forEach(item => {
    // bottom-up search for the deepest node created
    let path = item.path
    const itemsToCreateTreeNode = []
    while (path !== '' && !pathToNode.has(path)) {
      itemsToCreateTreeNode.push(pathToItem.get(path))
      // 'a/b' -> 'a'
      // 'a' -> ''
      path = path.substring(0, path.lastIndexOf('/'))
    }

    // top-down create nodes
    while (itemsToCreateTreeNode.length) {
      const item = itemsToCreateTreeNode.pop()
      const node = {
        ...nodeTemplate,
        ...item,
        name: item.path.replace(/^.*\//, ''),
        url: item.url ? GitHubHelper.getUrlForRedirect(metaData, item.type, item.path) : null,
        contents: item.type === 'tree' ? [] : null,
      }
      pathToNode.get(path).contents.push(node)
      pathToNode.set(node.path, node)
      path = node.path
    }
  })

  setParentNode(root)

  return {
    gitModules: findGitModules(root),
    root: sortFoldersToFront(root),
  }
}

export default {
  parse,
}
