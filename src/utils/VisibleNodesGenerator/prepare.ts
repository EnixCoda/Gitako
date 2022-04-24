import { VisibleNodes } from '.'

type SimpleTreeNode =
  | [string]
  | [
      string, // the path
      SimpleTreeNode[], // the contents
    ]

export const prepareNode = (node: VisibleNodes['nodes'][number]): SimpleTreeNode =>
  node.contents ? [node.path, node.contents.map(prepareNode)] : [node.path]
export const prepareMap = <K, T>(map: Map<K, T>) => Array.from(map.entries())
export const prepareSet = <T>(set: Set<T>) => Array.from(set.values())

export const prepareVisibleNodes = ({
  depths,
  expandedNodes,
  focusedNode,
  loading,
  nodes,
}: VisibleNodes) => ({
  focusedNode: focusedNode && prepareNode(focusedNode),
  depths: prepareMap(depths).map(([node, depth]) => [prepareNode(node), depth]),
  expandedNodes: prepareSet(expandedNodes),
  loading: prepareSet(loading),
  nodes: nodes.map(prepareNode),
})

function recursiveMarkDiff(
  node: SimpleTreeNode,
  state: 'lack' | 'extra' | 'diff',
  markDiff: (path: string, state: 'lack' | 'extra' | 'diff') => void,
) {
  if (node.length === 1) {
    const [path] = node
    markDiff(path, state)
  } else {
    const [name, children] = node
    for (const child of children) {
      recursiveMarkDiff(child, state, markDiff)
    }
  }
}

export function diff(
  a: SimpleTreeNode,
  b: SimpleTreeNode,
  markDiff: (path: string, state: 'lack' | 'extra' | 'diff') => void,
): boolean {
  let isDiff = false
  if (a.length === 2 && b.length === 2) {
    const [, aContents] = a
    const [, bContents] = b
    for (const aContent of aContents) {
      const [aPath] = aContent
      for (const bContent of bContents) {
        const [bPath] = bContent
        if (aPath === bPath) {
          isDiff = diff(aContent, bContent, markDiff) || isDiff
          break
        }
      }
    }

    const aPaths = new Map<string, SimpleTreeNode>(aContents.map(content => [content[0], content]))
    const bPaths = new Map<string, SimpleTreeNode>(bContents.map(content => [content[0], content]))
    for (const [path, simpleTreeNode] of bPaths.entries()) {
      if (!aPaths.has(path)) recursiveMarkDiff(simpleTreeNode, 'extra', markDiff)
    }
    for (const [path, simpleTreeNode] of aPaths.entries()) {
      if (!bPaths.has(path)) recursiveMarkDiff(simpleTreeNode, 'lack', markDiff)
    }
  } else if (a.length === 2 && b.length === 1) {
    isDiff = true
    const [, aContents] = a

    aContents.forEach(aContent => recursiveMarkDiff(aContent, 'lack', markDiff))
  } else if (a.length === 1 && b.length === 2) {
    isDiff = true
    const [, bContents] = b
    bContents.forEach(bContent => recursiveMarkDiff(bContent, 'extra', markDiff))
  }

  if (isDiff) markDiff(a[0], 'diff')
  return isDiff
}
