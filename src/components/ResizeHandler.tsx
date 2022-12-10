import { GrabberIcon } from '@primer/octicons-react'
import { Icon } from 'components/Icon'
import * as React from 'react'
import { ResizeState, useResizeHandler } from '../utils/hooks/useResizeHandler'
import { Size2D } from './Size'

type Props = {
  size: Size2D
  onResize(size: Size2D): void
  onResetSize?(): void
  onResizeStateChange?(state: ResizeState): void
  style?: React.CSSProperties
}

export function ResizeHandler({ onResize, onResetSize, onResizeStateChange, size, style }: Props) {
  const { onPointerDown } = useResizeHandler(size, onResize, { onResizeStateChange })

  return (
    <div
      className={'gitako-resize-handler'}
      onPointerDown={onPointerDown}
      onDoubleClick={onResetSize}
      style={style}
    >
      <Icon IconComponent={GrabberIcon} />
    </div>
  )
}
