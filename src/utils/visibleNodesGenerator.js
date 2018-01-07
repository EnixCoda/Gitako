/**
 * This is the stack for generating an array of nodes for rendering
 *
 * when lower layer changes, higher layers would reset
 * when higher layer changes, lower layers would not notice
 *
 *  render stack                 | when will change         | on change callback
 *
 *  ^  changes frequently
 *  |
 *  |4 focus                     | when hover/focus move    | onFocusChange
 *  |                            |                          |   expandedNodes + focusNode -> visibleNodes
 *  |3 expansion                 | when fold/unfold         | onExpansionChange
 *  |                            |                          |   searchedNodes + toggleNode -> expandedNodes
 *  |2 search key                | when search              | onSearch
 *  |                            |                          |   treeNodes + searchKey -> searchedNodes
 *  |1 tree: { root <-> nodes }  | when tree init           | treeHelper.parse
 *  |                                                       |   tree data from api -> { root, nodes }
 *  v  stable
 */

function getFilterFunc(keyRegex) {
  return function filterFunc({ name }) {
    return keyRegex.test(name)
  }
}

function search(treeNodes, searchKey) {
  if (!searchKey) return
  /**
   * if searchKey is 'abcd'
   * then keyRegex will be /a.*?b.*?c.*?d/i
   */
  const keyRegex = new RegExp(
    searchKey
      .replace(/\//, '')
      .split('')
      .join('.*?'),
    'i'
  )
  return treeNodes.filter(getFilterFunc(keyRegex))
}

function debounce(func, delay) {
  let timer
  return (...args) => {
    return new Promise(resolve => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => resolve(func(...args)), delay)
    })
  }
}

export const debouncedSearch = debounce(search, 250)

export default class VisibleNodesGenerator {
  // LEVEL 1
  root = null
  nodes = null
  plantTree(root, nodes) {
    this.root = root
    this.nodes = nodes

    // a simplified sync 'search'
    this.searchedNodes = this.root.contents
    this.generateVisibleNodes()
  }

  // LEVEL 2
  searchedNodes = null
  async search(searchKey) {
    this.searchedNodes = (await debouncedSearch(this.nodes, searchKey)) || this.root.contents
    this.expandedNodes.clear()
    this.generateVisibleNodes()
  }

  // LEVEL 3
  expandedNodes = new Set()
  depths = new Map()
  toggleExpand(node) {
    this.setExpand(node, !this.expandedNodes.has(node))
  }

  setExpand(node, expand) {
    if (expand && node.contents) {
      // only node with contents is expandable
      this.expandedNodes.add(node)
    } else {
      this.expandedNodes.delete(node)
    }
    this.generateVisibleNodes()
  }

  expandTo(path) {
    let rootNode = this.root
    let targetPath
    for (const step of path) {
      targetPath = rootNode.path ? `${rootNode.path}/${step}` : step
      rootNode = rootNode.contents.find(node => node.path === targetPath)
      this.setExpand(rootNode, true)
    }
    return rootNode
  }

  visibleNodes = null
  generateVisibleNodes() {
    this.focusedNode = null
    this.depths.clear()
    const nodesSet = new Set() // prevent duplication
    const get = (nodes, depth = 0) => {
      return [].concat(
        ...nodes.map(node => {
          if (nodesSet.has(node)) return []
          this.depths.set(node, depth)
          nodesSet.add(node)
          const children = this.expandedNodes.has(node) ? get(node.contents, depth + 1) : []
          return [node, ...children]
        })
      )
    }
    this.visibleNodes = {
      nodes: get(this.searchedNodes),
      depths: this.depths,
      expandedNodes: this.expandedNodes,
    }
    this.focusNode(null)
  }

  // LEVEL 4
  focusedNode = null
  focusNode(node) {
    this.focusedNode = node
    this.visibleNodes.focusedNode = node
  }
}
