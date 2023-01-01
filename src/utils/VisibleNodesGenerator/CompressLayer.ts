import { EventHub } from '../EventHub'
import { withEffect } from '../general'
import { Options } from './index'
import { ShakeLayer } from './ShakeLayer'

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

export class CompressLayer extends ShakeLayer {
  private compress: boolean
  depths = new Map<TreeNode, number>()
  compressedRoot: TreeNode | null = null
  compressHub = new EventHub<{ emit: TreeNode | null }>()

  constructor(options: Options) {
    super(options)
    this.compress = Boolean(options.compress)

    this.shakeHub.addEventListener('emit', () => this.compressTree())
  }

  setCompression(compress: CompressLayer['compress']) {
    this.compress = compress
    this.compressTree()
  }

  private compressTree = withEffect(
    () => {
      this.compressedRoot =
        this.compress && this.shackedRoot
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
