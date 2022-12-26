import { EventHub } from '../EventHub'
import { findNode, traverse, withEffect } from '../general'
import { CompressLayer } from './CompressLayer'
import { Options, SearchParams } from './index'

export class FlattenLayer extends CompressLayer {
  focusedNode: TreeNode | null = null
  nodes: TreeNode[] = []
  expandedNodes: Set<TreeNode['path']> = new Set()
  backupExpandedNodes: Set<TreeNode['path']> = new Set()
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
    // expanding non-tree node could cause unexpected UX
    if (node.type === 'tree') {
      if (expand) this.expandedNodes.add(node.path)
      else this.expandedNodes.delete(node.path)
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
      node => {
        this.$setExpand(node, expand)
        return recursive
      },
      node => node.contents || [],
    )
  }, this.generateVisibleNodes)

  expandTo = withEffect(async (path: string) => {
    const rootNode = this.compressedRoot
    if (rootNode) {
      await traverse(
        rootNode.contents,
        async node => {
          const overflowChar = path[node.path.length]
          const match = path.startsWith(node.path) && (overflowChar === '/' || !overflowChar)
          if (match) {
            if (node.path === path) {
              // do not wait for expansion for the exact node as that will block "jumping from search"
              this.$setExpand(node, true)
            } else await this.$setExpand(node, true)
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
    searchParams: Pick<SearchParams, 'matchNode'> | null,
    restoreExpandedFolders?: boolean,
  ) => {
    if (searchParams) {
      if (!this.isSearching) {
        // backup expansion when start search
        this.backupExpandedNodes.clear()
        this.expandedNodes.forEach(path => this.backupExpandedNodes.add(path))
      }
      this.expandedNodes.clear() // Reset expansion on every search, ensure cleanest search result expansion
      this.shake({
        matchNode: searchParams.matchNode,
        onChildMatch: node => this.$setExpand(node, true),
      })
    } else {
      this.shake(null)
      // collapse all nodes on clearing search key
      this.expandedNodes.clear()
      if (restoreExpandedFolders) {
        this.backupExpandedNodes.forEach(path => this.expandedNodes.add(path))
        this.backupExpandedNodes.clear()
      }
    }
  }
}
