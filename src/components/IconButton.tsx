import { IconProps } from '@primer/octicons-react'
import { Box, merge, SxProp, useTheme } from '@primer/react'
import { getBaseStyles, getSizeStyles, getVariantStyles } from '@primer/react/lib-esm/Button/styles'
import {
  IconButtonProps as PrimerIconButtonProps,
  StyledButton,
} from '@primer/react/lib-esm/Button/types'
import React, { forwardRef } from 'react'
import { is } from 'utils/is'

export type IconButtonProps = PrimerIconButtonProps & {
  iconSize?: IconProps['size']
  iconColor?: string
}

// Modified version of @primer/react/lib-esm/Button/Button.tsx
// Added better support of colors & size

export const IconButton = forwardRef(function IconButton(
  props: IconButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    variant = 'default',
    size = 'medium',
    iconSize, // grow the icon to the same size as the button
    iconColor, // extra control of icon color
    sx: sxProp = {},
    icon: Icon,
    ...rest
  } = props
  const { theme } = useTheme()
  const sxStyles = merge.all(
    [
      getBaseStyles(theme),
      getSizeStyles(size, variant, true),
      getVariantStyles(variant, theme),
      // Unsatisfied with preset color of the `invisible` variant
      {
        color: iconColor || (variant === 'invisible' ? 'fg.subtle' : undefined),
      },
      sxProp as SxProp,
    ].filter(is.not.undefined),
  )
  return (
    <StyledButton sx={sxStyles} ref={ref} {...rest}>
      <Box as="span" sx={{ display: 'inline-block' }}>
        <Icon size={iconSize} />
      </Box>
    </StyledButton>
  )
})
