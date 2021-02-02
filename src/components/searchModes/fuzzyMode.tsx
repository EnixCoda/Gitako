import * as React from 'react'
import { ModeShape } from '.'
import { Highlight } from '../Highlight'

export const fuzzyMode: ModeShape = {
  getSearchParams(searchKey) {
    const matchNode = (node: TreeNode) => fuzzyMatch(searchKey, node.path)
    return {
      matchNode,
    }
  },
  renderNodeLabelText(node, searchKey) {
    const { name, path } = node
    const indexes = fuzzyMatchIndexes(searchKey, path, path.length - name.length)
    return (
      <span>
        <Highlight
          match={new RegExp(indexes.map(i => (i === 0 ? `^.` : `(?<=^.{${i}}).`)).join('|'))}
          text={name}
        />
      </span>
    )
  },
}

function fuzzyMatch(input: string, sample: string) {
  let i = 0,
    j = 0
  while (i < input.length && j < sample.length) {
    if (input[i] === sample[j]) i++
    j++
  }
  return i === input.length
}

function fuzzyMatchIndexes(input: string, sample: string, shift: number = 0) {
  const r: number[] = []
  let i = 0,
    j = 0
  while (i < input.length && j < sample.length) {
    if (input[i] === sample[j]) {
      if (j >= shift) r.push(j - shift)
      i++
    }
    j++
  }
  return r
}
