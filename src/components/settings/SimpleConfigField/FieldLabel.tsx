import * as React from 'react'
import { ConfigKeys } from 'utils/config/helper'
import { SimpleConfigField } from '.'

export function FieldLabel<Key extends ConfigKeys>({
  label,
  wikiLink,
  tooltip,
}: SimpleConfigField<Key>) {
  return (
    <>
      {label}
      {(wikiLink || tooltip) && ' '}
      {wikiLink ? (
        <a href={wikiLink} title={tooltip} target="_blank" rel="noopener noreferrer">
          (?)
        </a>
      ) : (
        tooltip && (
          <span className={'help'} title={tooltip}>
            (?)
          </span>
        )
      )}
    </>
  )
}
