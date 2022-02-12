import { Icon } from 'components/Icon'
import * as React from 'react'
import { Size2D } from './SideBarBodyWrapper'

type Props = {
  size: Size2D
  onResize(size: Size2D): void
  onResetSize?(): void
  onResizeStateChange?(state: ResizeState): void
  style?: React.CSSProperties
}

type ResizeState = 'idle' | 'resizing'

export function ResizeHandler({ onResize, onResetSize, onResizeStateChange, size, style }: Props) {
  const { onPointerDown } = useResizeHandler(size, onResize, { onResizeStateChange })

  return (
    <div
      className={'gitako-resize-handler'}
      onPointerDown={onPointerDown}
      onDoubleClick={onResetSize}
      style={style}
    >
      <Icon type={'grabber'} className={'grabber-icon'} size={20} />
    </div>
  )
}

export function useResizeHandler(
  size: Size2D,
  onResize: (size: Size2D) => void,
  {
    onResizeStateChange,
    onClick,
  }: Partial<{
    onResizeStateChange: (state: ResizeState) => void
    onClick: (e: PointerEvent) => void
  }> = {},
) {
  const pointerDown = React.useRef(false)
  const pointerMoved = React.useRef(false)
  const initialSizeRef = React.useRef([0, 0])
  const baseSize = React.useRef(size)
  const latestPropSize = React.useRef(size)

  React.useEffect(() => {
    latestPropSize.current = size
  }, [size])

  React.useEffect(() => {
    const onPointerMove = ({ clientX, clientY }: PointerEvent) => {
      if (!pointerDown.current) return
      pointerMoved.current = true
      const [x, y] = baseSize.current
      onResize([x + clientX - initialSizeRef.current[0], y + clientY - initialSizeRef.current[1]])
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [onResize])

  React.useEffect(() => {
    const onPointerUp = (e: PointerEvent) => {
      if (pointerDown.current) {
        pointerDown.current = false

        if (!pointerMoved.current) onClick?.(e)
        pointerMoved.current = false

        baseSize.current = latestPropSize.current
        onResizeStateChange?.('idle')
      }
    }
    window.addEventListener('pointerup', onPointerUp)
    return () => window.removeEventListener('pointerup', onPointerUp)
  }, [])

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault() // Prevent unexpected selection when dragging in Safari
    const { clientX, clientY } = e
    pointerDown.current = true
    initialSizeRef.current = [clientX, clientY]
    baseSize.current = latestPropSize.current
    onResizeStateChange?.('resizing')
  }, [])

  return { onPointerDown }
}
