import * as React from 'react'
import { cx } from 'utils/cx'
import { ModeShape } from '.'
import { Highlight } from '../Highlight'

export const fuzzyMode: ModeShape = {
  getSearchParams(searchKey) {
    if (!searchKey) return null

    const matchNode = (node: TreeNode) => fuzzyMatch(searchKey, node.path)
    return {
      matchNode,
    }
  },
  renderNodeLabelText(node, searchKey) {
    const { name, path } = node

    const result: React.ReactNode[] = []
    const chunks = name.split('/')
    let renderedPath = path.slice(0, path.length - name.length)
    chunks.forEach((chunk, index, chunks) => {
      renderedPath += '/' + chunk
      const indexes = fuzzyMatchIndexes(searchKey, renderedPath, renderedPath.length - chunk.length)
      const regexp = new RegExp(indexes.map(i => `(?<=^.{${i}}).`).join('|'))
      result.push(
        <span key={chunk} className={cx({ prefix: index + 1 !== chunks.length })}>
          <Highlight match={regexp} text={chunk} />
          {index + 1 !== chunks.length && '/'}
        </span>,
      )
    })
    return result
  },
}

function fuzzyMatch(input: string, sample: string) {
  let i = 0,
    j = 0
  while (i < input.length && j < sample.length) {
    if (input[i] === sample[j++]) i++
  }
  return i === input.length
}

function fuzzyMatchIndexes(input: string, sample: string, shift: number = 0) {
  const indexes: number[] = []
  let i = 0,
    j = 0
  while (i < input.length && j < sample.length) {
    if (input[i] === sample[j]) {
      if (j >= shift) indexes.push(j - shift)
      i++
    }
    j++
  }
  return indexes
}
