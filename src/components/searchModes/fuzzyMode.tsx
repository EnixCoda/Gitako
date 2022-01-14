import * as React from 'react'
import { cx } from 'utils/cx'
import { hasUpperCase } from 'utils/general'
import { ModeShape } from '.'
import { Highlight } from '../Highlight'

export const fuzzyMode: ModeShape = {
  getSearchParams(searchKey) {
    if (!searchKey) return null

    const matchNode = (node: TreeNode) =>
      fuzzyMatch(searchKey, hasUpperCase(searchKey) ? node.path : node.path.toLowerCase())
    return {
      matchNode,
    }
  },
  renderNodeLabelText(node, searchKey) {
    const { name, path } = node

    const indexes = fuzzyMatchIndexes(
      searchKey.toLowerCase(),
      path.toLowerCase(),
      path.length - name.length,
    )
    const chunks = name.split('/')
    let progress = 0
    return chunks.map((chunk, index, chunks) => {
      const chunkIndexes = indexes.filter(i => i >= progress && i < chunk.length + progress)
      const regexp = chunkIndexes.length
        ? new RegExp(chunkIndexes.map(i => `(?<=^.{${i - progress}}).`).join('|'))
        : undefined
      progress += chunk.length + 1
      return (
        <span key={index} className={cx({ prefix: index + 1 !== chunks.length })}>
          <Highlight match={regexp} text={index + 1 === chunks.length ? chunk : chunk + '/'} />
        </span>
      )
    })
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
