import * as React from 'react'
import { cx } from 'utils/cx'
import { searchKeyToRegexp } from 'utils/general'
import { ModeShape } from '.'
import { Highlight } from '../Highlight'

export const regexMode: ModeShape = {
  getSearchParams(searchKey) {
    const regexp = searchKeyToRegexp(searchKey)
    if (regexp) {
      return {
        matchNode: node => regexp.test(node.name),
      }
    }

    return null
  },
  renderNodeLabelText(node, searchKey) {
    const regex = searchKeyToRegexp(searchKey) || undefined
    const { name } = node
    return name.includes('/') ? (
      name.split('/').map((chunk, index, chunks) => (
        <span key={index} className={cx({ prefix: index + 1 !== chunks.length })}>
          <Highlight match={regex} text={chunk} />
          {index + 1 !== chunks.length && '/'}
        </span>
      ))
    ) : (
      <Highlight match={regex} text={name} />
    )
  },
}
