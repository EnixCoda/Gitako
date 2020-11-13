import { EventHub } from './EventHub'
import { findNode, searchKeyToRegexp, traverse, withEffect } from './general'

function search(
  root: TreeNode,
  match: (node: TreeNode) => boolean,
  onChildMatch: (node: TreeNode) => void,
): TreeNode | null {
  // go traverse no matter root matches or not to make sure find all nodes
  const contents = []

  if (root.type === 'tree' && root.contents) {
    let childMatch = false
    for (const node of root.contents) {
      if (match(node)) {
        childMatch = true
        break
      }
    }

    for (const node of root.contents) {
      const $node = search(node, match, onChildMatch)
      if ($node) {
        if ($node !== node) childMatch = true
        contents.push($node)
      }
    }

    if (childMatch) {
      onChildMatch(root)
    }

    if (contents?.length) {
      return {
        ...root,
        contents,
      }
    }
  }

  if (match(root)) {
    return root
  }
  return null
}

function compressTree(root: TreeNode, prefix: string[] = []): TreeNode {
  if (root.contents) {
    if (root.contents.length === 1) {
      const [singleton] = root.contents
      if (singleton.type === 'tree') {
        return compressTree(singleton, [...prefix, root.name])
      }
    }

    let compressed = false
    const contents = []
    for (const node of root.contents) {
      const $node = compressTree(node)
      if ($node !== node) compressed = true
      contents.push($node)
    }
    if (compressed)
      return {
        ...root,
        name: [...prefix, root.name].join('/'),
        contents,
      }
  }
  return prefix.length
    ? {
        ...root,
        name: [...prefix, root.name].join('/'),
      }
    : root
}

function mergeNodes(target: TreeNode, source: TreeNode) {
  for (const node of source.contents || []) {
    const dup = target.contents?.find($node => $node.path === node.path)
    if (dup) {
      mergeNodes(dup, node)
    } else {
      if (!target.contents) target.contents = []
      target.contents.push(node)
    }
  }
}

class BaseLayer {
  baseRoot: TreeNode
  getTreeData: (path: string) => Async<TreeNode>
  loading: Set<TreeNode['path']> = new Set()

  baseHub = new EventHub<{
    emit: BaseLayer['baseRoot']
    loadingChange: BaseLayer['loading']
  }>()

  constructor({ root, getTreeData }: Options) {
    this.baseRoot = root
    this.getTreeData = getTreeData
  }

  loadTreeData = async (path: string) => {
    const node = await findNode(this.baseRoot, path)
    if (node && node.type !== 'tree') return node
    if (node?.contents?.length) return node // check in memory
    if (this.loading.has(path)) return

    this.loading.add(path)
    this.baseHub.emit('loadingChange', this.loading)
    mergeNodes(this.baseRoot, await this.getTreeData(path))
    this.loading.delete(path)
    this.baseHub.emit('loadingChange', this.loading)
    this.baseHub.emit('emit', this.baseRoot)

    return await findNode(this.baseRoot, path)
  }
}

class ShakeLayer extends BaseLayer {
  shackedRoot: TreeNode | null = null
  lastMatch: Parameters<ShakeLayer['shake']>[0] = undefined
  shakeHub = new EventHub<{ emit: TreeNode | null }>()

  constructor(options: Options) {
    super(options)

    this.baseHub.addEventListener('emit', () => this.shake(this.lastMatch))
  }

  shake = withEffect(
    (p?: {
      match: {
        // shape in object for better extensibility
        searchKey: string
      }
      onChildMatch: (node: TreeNode) => void
    }) => {
      this.lastMatch = p
      if (p) {
        const {
          match: { searchKey },
          onChildMatch,
        } = p

        const regexp = searchKeyToRegexp(searchKey)
        if (regexp) {
          this.shackedRoot = search(this.baseRoot, node => regexp.test(node.name), onChildMatch)
          return
        }
      }
      this.shackedRoot = this.baseRoot
    },
    () => this.shakeHub.emit('emit', this.shackedRoot),
  )
}

class CompressLayer extends ShakeLayer {
  private compress: boolean
  depths = new Map<TreeNode, number>()
  compressedRoot: TreeNode | null = null
  compressHub = new EventHub<{ emit: TreeNode | null }>()

  constructor(options: Options) {
    super(options)
    this.compress = Boolean(options.compress)

    this.shakeHub.addEventListener('emit', () => this.compressTree())
  }

  private compressTree = withEffect(
    () => {
      this.compressedRoot =
        this.shackedRoot && this.compress
          ? {
              ...this.shackedRoot,
              contents: this.shackedRoot.contents?.map(node => compressTree(node)),
            }
          : this.shackedRoot

      if (this.compressedRoot) {
        const depths = new Map<TreeNode, number>()
        const recordDepth = (node: TreeNode, depth = 0) => {
          depths.set(node, depth)
          for (const $node of node.contents || []) {
            recordDepth($node, depth + 1)
          }
        }
        recordDepth(this.compressedRoot, -1)
        this.depths = depths
      }
    },
    () => this.compressHub.emit('emit', this.compressedRoot),
  )
}

class FlattenLayer extends CompressLayer {
  focusedNode: TreeNode | null = null
  nodes: TreeNode[] = []
  expandedNodes: Set<TreeNode['path']> = new Set()
  flattenHub = new EventHub<{ emit: null }>()

  constructor(options: Options) {
    super(options)

    this.compressHub.addEventListener('emit', () => this.generateVisibleNodes())
  }

  generateVisibleNodes = withEffect(
    async () => {
      const nodes: TreeNode[] = []
      const focusedNode = this.focusedNode

      if (
        focusedNode &&
        this.compressedRoot &&
        !(await findNode(this.compressedRoot, focusedNode.path))
      ) {
        // rescue the focus after expanding async singleton folder
        await traverse(
          this.compressedRoot.contents,
          node => {
            if (node.type === 'tree' && node.path.startsWith(focusedNode.path)) {
              this.focusNode(node)
            }

            return node.type === 'tree' && this.expandedNodes.has(node.path)
          },
          node => node.contents || [],
        )
      }

      await traverse(
        this.compressedRoot?.contents,
        node => {
          nodes.push(node)
          return node.type === 'tree' && this.expandedNodes.has(node.path)
        },
        node => node.contents || [],
      )
      this.nodes = nodes
    },
    () => this.flattenHub.emit('emit', null),
  )

  focusNode = (node: TreeNode | null) => {
    if (this.focusedNode !== node) {
      this.focusedNode = node
      this.flattenHub.emit('emit', null)
    }
  }

  barelySetExpand = (node: TreeNode, expand: boolean) => {
    if (expand) {
      if (node.type === 'tree') {
        // expanding non-tree node could cause unexpected UX
        this.expandedNodes.add(node.path)
      }
    } else {
      this.expandedNodes.delete(node.path)
    }
  }

  $setExpand = (node: TreeNode, expand: boolean) => {
    this.barelySetExpand(node, expand)
    // The `node.contents?.length` condition is critical to search performance as it reduces lots of function calls
    if (expand && node.type === 'tree' && !node.contents?.length)
      return this.loadTreeData(node.path)
  }
  setExpand = withEffect(this.$setExpand, this.generateVisibleNodes)

  toggleExpand = withEffect(async (node: TreeNode, recursive = false) => {
    const expand = !this.expandedNodes.has(node.path)
    await traverse(
      [node],
      async node => {
        await this.$setExpand(node, expand)
        return recursive
      },
      node => node.contents || [],
    )
  }, this.generateVisibleNodes)

  expandTo = withEffect(async (path: string) => {
    const rootNode = this.compressedRoot
    if (rootNode) {
      await traverse(
        [rootNode],
        async node => {
          const overflowChar = node.path[path.length + 1]
          const match = path.startsWith(node.path) && (overflowChar === '/' || !overflowChar)
          if (node.path) {
            // rootNode.path === ''
            if (match) {
              if (node.path === path) {
                // do not wait for expansion for the exact node as that will block "jumping from search"
                this.$setExpand(node, true)
              } else await this.$setExpand(node, true)
            }
          }
          return match
        },
        node => node?.contents || [],
      )

      const node = await findNode(rootNode, path)
      return node
    }
  }, this.generateVisibleNodes)

  search = (
    match: {
      searchKey: string
    } | null,
  ) => {
    this.shake(
      match
        ? {
            match,
            onChildMatch: node => this.$setExpand(node, true),
          }
        : undefined,
    )
  }
}

type Options = {
  root: BaseLayer['baseRoot']
  getTreeData: BaseLayer['getTreeData']
  compress: CompressLayer['compress']
}

export type VisibleNodes = {
  loading: BaseLayer['loading']
  lastMatch: ShakeLayer['lastMatch']
  depths: CompressLayer['depths']
  nodes: FlattenLayer['nodes']
  expandedNodes: FlattenLayer['expandedNodes']
  focusedNode: FlattenLayer['focusedNode']
}

export class VisibleNodesGenerator extends FlattenLayer {
  hub = new EventHub<{
    emit: VisibleNodes
  }>()
  constructor(options: Options) {
    super(options)

    this.flattenHub.addEventListener('emit', () => this.update())
    this.baseHub.addEventListener('loadingChange', () => this.update())
  }

  onUpdate(callback: (visibleNodes: VisibleNodes) => void) {
    return this.hub.addEventListener('emit', callback)
  }

  update() {
    this.hub.emit('emit', this.visibleNodes)
  }

  get visibleNodes(): VisibleNodes {
    return {
      nodes: this.nodes,
      lastMatch: this.lastMatch,
      depths: this.depths,
      expandedNodes: this.expandedNodes,
      focusedNode: this.focusedNode,
      loading: this.loading,
    }
  }
}
