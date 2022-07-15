import { IconProps } from '@primer/octicons-react'
import { Box, merge, SxProp, useTheme } from '@primer/react'
import { getBaseStyles, getSizeStyles, getVariantStyles } from '@primer/react/lib/Button/styles'
import {
  IconButtonProps as PrimerIconButtonProps,
  StyledButton,
} from '@primer/react/lib/Button/types'
import React from 'react'
import { is } from 'utils/is'

export type IconButtonProps = PrimerIconButtonProps & {
  iconSize?: IconProps['size']
  iconColor?: string
}

// Modified version of @primer/react/lib/Button/Button.tsx
// Added better support of colors & size

export function IconButton(props: IconButtonProps) {
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
    <StyledButton sx={sxStyles} {...rest}>
      <Box as="span" sx={{ display: 'inline-block' }}>
        <Icon size={iconSize} />
      </Box>
    </StyledButton>
  )
}
