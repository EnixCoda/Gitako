import * as React from 'react'
import { cx } from 'utils/cx'
import { hasUpperCase } from 'utils/general'
import { ModeShape } from '.'
import { HighlightOnIndexes } from '../HighlightOnIndexes'

export const fuzzyMode: ModeShape = {
  getSearchParams(searchKey) {
    if (!searchKey) return null

    const matchNode = (node: TreeNode) => {
      const path = hasUpperCase(searchKey) ? node.path : node.path.toLowerCase()
      const { match, lastIndex } = fuzzyMatch(searchKey, path)
      return match && (searchKey[searchKey.length - 1] === '/' || lastIndex > path.lastIndexOf('/'))
    }
    return {
      matchNode,
    }
  },
  renderNodeLabelText(node, searchKey) {
    const { name } = node
    const path = hasUpperCase(searchKey) ? node.path : node.path.toLowerCase()

    const indexes = fuzzyMatchIndexes(searchKey, path, path.length - name.length)
    const chunks = name.split('/')
    let progress = 0
    return chunks.map((chunk, index, chunks) => {
      const chunkIndexes = indexes.filter(i => i >= progress && i < chunk.length + progress)

      const highlightIndexes = chunkIndexes.length ? chunkIndexes.map(i => i - progress) : undefined

      progress += chunk.length + 1 // not neat side effect in map function
      return (
        <span key={index} className={cx({ prefix: index + 1 !== chunks.length })}>
          <HighlightOnIndexes
            indexes={highlightIndexes}
            text={index + 1 === chunks.length ? chunk : chunk + '/'}
          />
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
  return {
    lastIndex: j - 1,
    match: i === input.length,
  }
}

function fuzzyMatchIndexes(input: string, sample: string, shift = 0) {
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
