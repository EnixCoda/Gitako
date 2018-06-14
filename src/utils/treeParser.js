import GitHubHelper from './GitHubHelper'

const nodeTemplate = {
  name: null,
  path: null,
  mode: null,
  type: null,
  sha: null,
  url: null,
}

function sortFoldersToFront(root) {
  const isFolder = node => node.type === 'tree'
  const isNotFolder = (...args) => !isFolder(...args)
  function DFS(root) {
    const nodes = root.contents
    if (nodes) {
      nodes.splice(0, Infinity, ...nodes.filter(isFolder), ...nodes.filter(isNotFolder))
      nodes.forEach(DFS)
    }
    return root
  }
  return DFS(root)
}

function setParentNode(root, parent = null) {
  root.parent = parent
  if (root.contents) {
    root.contents.forEach(node => setParentNode(node, root))
  }
}

function parse(treeData, metaData) {
  const { tree } = treeData

  // nodes are created from items and put onto tree
  const pathToNode = new Map()
  const pathToItem = new Map()

  const root = { ...nodeTemplate, name: '', path: '', contents: [] }
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
        url: item.url
          ? GitHubHelper.getUrlForRedirect(metaData, item.path)
          : null,
        contents: item.type === 'tree' ? [] : null,
      }
      pathToNode.get(path).contents.push(node)
      pathToNode.set(node.path, node)
      path = node.path
    }
  })

  setParentNode(root)
  return {
    root: sortFoldersToFront(root),
    nodes: Array.from(pathToNode.values()),
  }
}

export default {
  parse,
}
