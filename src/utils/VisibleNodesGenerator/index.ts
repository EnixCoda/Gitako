import { EventHub } from '../EventHub'
import { BaseLayer } from './BaseLayer'
import { CompressLayer } from './CompressLayer'
import { FlattenLayer } from './FlattenLayer'

export type SearchParams = {
  matchNode(node: TreeNode): boolean
  onChildMatch(node: TreeNode): void
}

export type Options = {
  root: BaseLayer['baseRoot']
  defer?: BaseLayer['defer']
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

    this.flattenHub.addEventListener('emit', () => this.update())
    this.baseHub.addEventListener('loadingChange', () => this.update())

    this.search(null)
  }

  onUpdate(callback: (visibleNodes: VisibleNodes) => void) {
    return this.hub.addEventListener('emit', callback)
  }

  onNextUpdate(callback: (visibleNodes: VisibleNodes) => void) {
    const oneTimeSubscription = (visibleNodes: VisibleNodes) => {
      cancel()
      callback(visibleNodes)
    }
    const cancel = this.hub.addEventListener('emit', oneTimeSubscription)
    return cancel
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
