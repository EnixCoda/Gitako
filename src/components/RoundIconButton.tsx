import React, { ForwardedRef, forwardRef } from 'react'
import { IconButton, IconButtonProps } from './IconButton'

export const RoundIconButton = forwardRef(function RoundIconButton(
  props: IconButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <IconButton
      ref={ref}
      variant="invisible"
      title={props['aria-label']}
      {...props}
      sx={{
        borderRadius: '20px',
        ...props.sx,
      }}
    />
  )
})
