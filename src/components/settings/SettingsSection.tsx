import { Box } from '@primer/react'
import * as React from 'react'

type Props = {
  title?: React.ReactNode
}

export function SettingsSection({ title, children }: React.PropsWithChildren<Props>) {
  return (
    <Box display="grid" gridGap={'2px'}>
      {title && <h3>{title}</h3>}
      {children}
    </Box>
  )
}
