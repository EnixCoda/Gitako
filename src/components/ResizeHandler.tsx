import { Icon } from 'components/Icon'
import * as React from 'react'
import { Size } from './SideBarBodyWrapper'

type Props = {
  size: Size
  onResize(size: Size): void
  onResizeStateChange?(state: ResizeState): void
  style?: React.CSSProperties
}

type ResizeState = 'idle' | 'resizing'

export function HorizontalResizeHandler({ onResize, onResizeStateChange, size, style }: Props) {
  const pointerDown = React.useRef(false)
  const startX = React.useRef(0)
  const baseSize = React.useRef(size)
  const latestPropSize = React.useRef(size)

  React.useEffect(() => {
    latestPropSize.current = size
  }, [size])

  const onPointerDown = React.useCallback(({ clientX }: React.MouseEvent) => {
    startX.current = clientX
    pointerDown.current = true
    baseSize.current = latestPropSize.current
    onResizeStateChange?.('resizing')
  }, [])

  React.useEffect(() => {
    const onPointerMove = ({ clientX }: MouseEvent) => {
      if (!pointerDown.current) return
      const shift = clientX - startX.current
      onResize(baseSize.current + shift)
    }
    window.addEventListener('mousemove', onPointerMove)
    return () => window.removeEventListener('mousemove', onPointerMove)
  }, [onResize])

  React.useEffect(() => {
    const onPointerUp = () => {
      if (pointerDown.current) {
        pointerDown.current = false
        baseSize.current = latestPropSize.current
        onResizeStateChange?.('idle')
      }
    }
    window.addEventListener('mouseup', onPointerUp)
    return () => window.removeEventListener('mouseup', onPointerUp)
  }, [])

  return (
    <div className={'gitako-resize-handler'} onMouseDown={onPointerDown} style={style}>
      <Icon type={'grabber'} className={'grabber-icon'} size={20} />
    </div>
  )
}
