import * as React from 'react'
import { cx } from 'utils/cx'
import { hasUpperCase } from 'utils/general'
import { ModeShape } from '.'

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

      const $indexes = chunkIndexes.length ? chunkIndexes.map(i => i - progress) : undefined

      progress += chunk.length + 1
      return (
        <span key={chunk} className={cx({ prefix: index + 1 !== chunks.length })}>
          <Highlight match={$indexes} text={index + 1 === chunks.length ? chunk : chunk + '/'} />
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

function Highlight(props: { text: string; match?: number[] }) {
  const { text, match } = props

  if (!match?.length) return <>{text}</>

  return (
    <>
      {text
        .split('')
        .map((char, i) =>
          match.includes(i) ? <mark key={i}>{char}</mark> : <span key={i}>{char}</span>,
        )}
    </>
  )
}
