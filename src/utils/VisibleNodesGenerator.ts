import { findNode } from './general'

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
 *  |1 tree: { root <-> nodes }  | when tree init or search | treeHelper.parse
 *  |                                                       |   tree data from api -> { root, nodes }
 *  v  stable
 */

function search(
  root: TreeNode,
  regexps: RegExp[],
  onMatch: (node: TreeNode) => void,
): TreeNode | null {
  if (!regexps.length) {
    return root
  }

  // go traverse no matter root matches or not to make sure find all nodes matches
  const children =
    root.type === 'tree'
      ? root.contents
          ?.map(item => search(item, regexps, onMatch))
          .filter(function (result): result is TreeNode {
            return result !== null
          })
      : []

  if (isNodeMatch(root, regexps)) {
    onMatch(root)
    return root
  }

  if (children?.length) {
    return {
      ...root,
      contents: children,
    }
  }
  return null
}

function isNodeMatch(root: TreeNode, regexps: RegExp[]): boolean {
  return regexps.some(regexp => regexp.test(root.name))
}

function compressTree(root: TreeNode, prefix: string[] = []): TreeNode {
  if (root.contents) {
    if (root.contents.length === 1) {
      const singleton = root.contents[0]
      if (singleton.type === 'tree') {
        return compressTree(singleton, [...prefix, root.name])
      }
    }
  }
  return {
    ...root,
    name: [...prefix, root.name].join('/'),
    contents: root.contents ? root.contents.map(node => compressTree(node)) : undefined,
  }
}

class L1 {
  root: TreeNode

  constructor(root: TreeNode) {
    this.root = root
  }
}

class L2 {
  l1: L1
  couldCompress: boolean
  exactMatches: TreeNode[] = []
  finalRoot: TreeNode | null = null

  constructor(l1: L1, options: Options) {
    this.l1 = l1
    this.couldCompress = Boolean(options.compress)
    this.search([])
  }

  search = (regexps: RegExp[]) => {
    const shouldCompress = this.couldCompress && !regexps.length
    this.exactMatches.length = 0
    const rootNode = regexps.length
      ? search(this.l1.root, regexps, node => this.exactMatches.push(node))
      : this.l1.root
    this.finalRoot = rootNode && shouldCompress ? compressTree(rootNode) : rootNode
  }
}

class L3 {
  l1: L1
  l2: L2

  nodes: TreeNode[]
  expandedNodes: Set<TreeNode>
  depths: Map<TreeNode, number>

  constructor(l1: L1, l2: L2) {
    this.l1 = l1
    this.l2 = l2
    this.expandedNodes = new Set<TreeNode>()
    this.depths = new Map()
    this.nodes = []
  }

  toggleExpand = (node: TreeNode) => {
    this.setExpand(node, !this.expandedNodes.has(node))
  }

  setExpand = (node: TreeNode, expand: boolean) => {
    if (expand && node.contents) {
      // only node with contents is expandable
      this.expandedNodes.add(node)
    } else {
      this.expandedNodes.delete(node)
    }
    this.generateVisibleNodes()
  }

  expandTo = (path: string, expandAlongTheWay?: boolean) => {
    const rootNode = this.l2.finalRoot
    if (expandAlongTheWay && path.includes('/')) {
      this.expandTo(path.slice(0, path.lastIndexOf('/')), true)
    }
    const node = rootNode && findNode(rootNode, path.split('/'), node => this.setExpand(node, true))
    if (node) this.setExpand(node, true)
    return node
  }

  generateVisibleNodes = () => {
    this.depths.clear()
    const nodes: TreeNode[] = []
    if (this.l2.finalRoot !== null) {
      const traverse = (root: TreeNode, depth = 0) => {
        nodes.push(root)
        this.depths.set(root, depth)
        if (this.expandedNodes.has(root) && root.type === 'tree' && root.contents?.length) {
          for (const item of root.contents) {
            traverse(item, depth + 1)
          }
        }
      }
      for (const item of this.l2.finalRoot.contents || []) {
        traverse(item)
      }
    }
    this.nodes = nodes
  }
}

export type VisibleNodes = {
  nodes: L3['nodes']
  depths: L3['depths']
  expandedNodes: L3['expandedNodes']
  focusedNode: L4['focusedNode']
}

class L4 {
  l1: L1
  l2: L2
  l3: L3

  focusedNode: TreeNode | null

  constructor(l1: L1, l2: L2, l3: L3) {
    this.l1 = l1
    this.l2 = l2
    this.l3 = l3
    this.focusedNode = null
  }

  focusNode = (node: TreeNode | null) => {
    this.focusedNode = node
  }
}

type Options = {
  compress?: boolean
}

export class VisibleNodesGenerator {
  l1: L1
  l2: L2
  l3: L3
  l4: L4

  search: (regexps: RegExp[]) => void
  setExpand: L3['setExpand']
  toggleExpand: L3['toggleExpand']
  expandTo: L3['expandTo']
  focusNode: L4['focusNode']

  constructor(root: TreeNode, options: Options) {
    this.l1 = new L1(root)
    this.l2 = new L2(this.l1, options)
    this.l3 = new L3(this.l1, this.l2)
    this.l4 = new L4(this.l1, this.l2, this.l3)

    this.search = regexps => {
      this.l2.search(regexps)
      for (const node of this.l2.exactMatches) {
        this.expandTo(node.path, true)
      }
      this.l3.generateVisibleNodes()
      this.l4.focusNode(null)
    }
    this.setExpand = (...args) => this.l3.setExpand(...args)
    this.toggleExpand = (...args) => this.l3.toggleExpand(...args)
    this.expandTo = (...args) => this.l3.expandTo(...args)
    this.focusNode = (...args) => this.l4.focusNode(...args)
  }

  init() {
    this.l2.search([])
    this.l3.generateVisibleNodes()
  }

  get visibleNodes() {
    return {
      nodes: this.l3.nodes,
      depths: this.l3.depths,
      expandedNodes: this.l3.expandedNodes,
      focusedNode: this.l4.focusedNode,
    }
  }
}
