const isFolder = (node: TreeNode) => node.type === 'tree'
const isNotFolder = (node: TreeNode) => node.type !== 'tree'

export function sortFoldersToFront(root: TreeNode) {
  const nodes = root.contents
  if (nodes) {
    nodes.splice(0, Infinity, ...nodes.filter(isFolder), ...nodes.filter(isNotFolder))
    nodes.forEach(sortFoldersToFront)
  }
}

export function findGitModules(root: TreeNode) {
  if (root.contents) {
    const modulesFile = root.contents.find(content => content.name === '.gitmodules')
    if (modulesFile) {
      return modulesFile
    }
  }
  return null
}
