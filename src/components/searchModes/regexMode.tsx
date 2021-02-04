import * as React from 'react'
import { cx } from 'utils/cx'
import { isValidRegexpSource, searchKeyToRegexp } from 'utils/general'
import { ModeShape } from '.'
import { Highlight } from '../Highlight'

export const regexMode: ModeShape = {
  getSearchParams(searchKey) {
    if (!searchKey) return null

    const regexp = searchKeyToRegexp(searchKey)
    if (regexp) {
      const matchNode = (node: TreeNode) => regexp.test(node.name)

      return {
        matchNode,
      }
    }

    return null
  },
  renderNodeLabelText(node, searchKey) {
    const regex =
      searchKey && isValidRegexpSource(searchKey) ? new RegExp(searchKey, 'gi') : undefined
    const { name } = node
    return name.includes('/') ? (
      name.split('/').map((chunk, index, chunks) => (
        <span key={chunk} className={cx({ prefix: index + 1 !== chunks.length })}>
          <Highlight match={regex} text={chunk} />
          {index + 1 !== chunks.length && '/'}
        </span>
      ))
    ) : (
      <Highlight match={regex} text={name} />
    )
  },
}
