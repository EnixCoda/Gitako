import React from 'react'
import { IconButton, IconButtonProps } from './IconButton'

export function RoundIconButton(props: IconButtonProps) {
  return (
    <IconButton
      variant="invisible"
      title={props['aria-label']}
      {...props}
      sx={{
        borderRadius: '20px',
        ...props.sx,
      }}
    />
  )
}
