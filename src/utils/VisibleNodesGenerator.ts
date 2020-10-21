import { EventHub } from './EventHub'
import { findNode, traverse, withEffect } from './general'

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
    (p?: { match: (node: TreeNode) => boolean; onChildMatch: (node: TreeNode) => void }) => {
      this.lastMatch = p
      if (p) {
        const { match, onChildMatch } = p
        this.shackedRoot = search(this.baseRoot, match, onChildMatch)
      } else this.shackedRoot = this.baseRoot
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

  compressTree = withEffect(
    () => {
      this.depths.clear()
      this.compressedRoot =
        this.shackedRoot && this.compress
          ? {
              ...this.shackedRoot,
              contents: this.shackedRoot.contents?.map(node => compressTree(node)),
            }
          : this.shackedRoot

      const recordDepth = (node: TreeNode, depth = 0) => {
        this.depths.set(node, depth)
        for (const $node of node.contents || []) {
          recordDepth($node, depth + 1)
        }
      }
      if (this.compressedRoot) recordDepth(this.compressedRoot, -1)
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
      await traverse(
        this.compressedRoot?.contents,
        node => {
          nodes.push(node)
          return node.type === 'tree' && this.expandedNodes.has(node.path)
        },
        node => {
          return node.contents || []
        },
      )
      this.nodes = nodes
    },
    () => this.flattenHub.emit('emit', null),
  )

  focusNode = (node: TreeNode | null) => {
    this.focusedNode = node
  }

  barelySetExpand = (node: TreeNode, expand: boolean) => {
    if (expand) {
      this.expandedNodes.add(node.path)
    } else {
      this.expandedNodes.delete(node.path)
    }
  }

  $setExpand = (node: TreeNode, expand: boolean) => {
    this.barelySetExpand(node, expand)
    if (expand && node.type === 'tree') return this.loadTreeData(node.path)
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
          const match = path.startsWith(node.path)
          if (node.path && match) {
            // rootNode.path === ''
            await this.$setExpand(node, true)
          }
          return match
        },
        node => node?.contents || [],
      )

      const node = await findNode(rootNode, path)
      return node
    }
  }, this.generateVisibleNodes)

  search = withEffect((regexp: RegExp | null) => {
    this.focusNode(null)
    this.shake(
      regexp
        ? {
            match: node => regexp.test(node.name),
            onChildMatch: node => this.$setExpand(node, true),
          }
        : undefined,
    )
  }, this.generateVisibleNodes)
}

type Options = {
  root: BaseLayer['baseRoot']
  getTreeData: BaseLayer['getTreeData']
  compress: CompressLayer['compress']
}

export type VisibleNodes = {
  loading: BaseLayer['loading']
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

    this.focusNode = withEffect(this.focusNode.bind(this), this.update.bind(this))

    this.search(null)
    this.flattenHub.addEventListener('emit', () => this.update())
    this.baseHub.addEventListener('loadingChange', () => this.update())
  }

  update() {
    this.hub.emit('emit', this.visibleNodes)
  }

  get visibleNodes(): VisibleNodes {
    return {
      nodes: this.nodes,
      depths: this.depths,
      expandedNodes: this.expandedNodes,
      focusedNode: this.focusedNode,
      loading: this.loading,
    }
  }
}
