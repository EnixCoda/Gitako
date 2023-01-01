import { EventHub } from '../EventHub'
import { withEffect } from '../general'
import { BaseLayer } from './BaseLayer'
import { Options, SearchParams } from './index'

function search(
  root: TreeNode,
  match: (node: TreeNode) => boolean,
  onChildMatch: (node: TreeNode) => void,
): TreeNode | null {
  // go traverse no matter whether root matches to make sure find & expand the related nodes
  // The `related nodes` are the nodes that either itself matches or any of direct or indirect children match
  const contents = []

  if (root.type === 'tree' && root.contents) {
    for (const node of root.contents) {
      const $node = search(node, match, onChildMatch)
      if ($node) contents.push($node)
    }

    if (contents.length) onChildMatch(root)
  }

  // Return root if itself matches
  if (match(root)) return root

  // Otherwise, but when deeper nodes match, return partial root
  if (contents.length) {
    return {
      ...root,
      contents,
    }
  }

  return null
}

export class ShakeLayer extends BaseLayer {
  shackedRoot: TreeNode | null = this.baseRoot
  lastSearchParams: SearchParams | null = null
  shakeHub = new EventHub<{ emit: TreeNode | null }>()

  get isSearching() {
    return this.lastSearchParams !== null
  }

  constructor(options: Options) {
    super(options)

    this.baseHub.addEventListener('emit', () => this.shake(this.lastSearchParams))
  }

  shake = withEffect(
    (searchParams: ShakeLayer['lastSearchParams']) => {
      this.lastSearchParams = searchParams

      let root: ShakeLayer['shackedRoot'] = this.baseRoot
      if (searchParams) {
        const { matchNode, onChildMatch } = searchParams
        root = search(this.baseRoot, matchNode, onChildMatch)
      }
      this.shackedRoot = root
    },
    () => this.shakeHub.emit('emit', this.shackedRoot),
  )
}
