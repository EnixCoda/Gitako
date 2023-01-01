import { EventHub } from '../EventHub'
import { findNode } from '../general'
import { Options } from './index'

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

export class BaseLayer {
  baseRoot: TreeNode
  getTreeData: (path: string) => Async<TreeNode>
  loading: Set<TreeNode['path']> = new Set()
  defer: boolean

  baseHub = new EventHub<{
    emit: BaseLayer['baseRoot']
    loadingChange: BaseLayer['loading']
  }>()

  constructor({ root, getTreeData, defer = false }: Options) {
    this.baseRoot = root
    this.getTreeData = getTreeData
    this.defer = defer
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
