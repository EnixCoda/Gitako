import { InfoIcon, LinkExternalIcon } from '@primer/octicons-react'
import { Box } from '@primer/react'
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
        <a
          className={'help'}
          href={wikiLink}
          title={tooltip}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkExternalIcon size="small" />
        </a>
      ) : (
        tooltip && (
          <Box
            as="span"
            sx={{
              '.octicon': {
                color: 'fg.subtle',
              },
            }}
            className={'help'}
            title={tooltip}
          >
            <InfoIcon size="small" />
          </Box>
        )
      )}
    </>
  )
}
